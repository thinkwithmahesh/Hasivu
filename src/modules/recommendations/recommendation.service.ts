import { Prisma, PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { featureFlags } from '../../config/feature-flags';
import { OutboxRepository } from '../../events/outbox.repository';
import { RECOMMENDATION_DISCLAIMER } from './safety-policy';
import { RuleBasedRecommendationEngine } from './rule-based.engine';

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export class RecommendationService {
  private readonly ruleEngine = new RuleBasedRecommendationEngine();
  private readonly outboxRepo: OutboxRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.outboxRepo = new OutboxRepository(prisma);
  }

  private assertEnabled(): void {
    if (!featureFlags.isEnabled('RECOMMENDATIONS_ENABLED')) {
      throw Object.assign(new Error('Recommendations are not enabled'), {
        code: 'RECOMMENDATION_ENGINE_DISABLED',
        statusCode: 404,
      });
    }
  }

  async getRecommendations(args: {
    schoolId: string;
    userId: string;
    studentId?: string;
    date: string;
    slot: string;
    limit?: number;
  }) {
    this.assertEnabled();

    const [menuItems, studentProfile, recentOrders] = await Promise.all([
      this.prisma.menuItem.findMany({
        where: {
          schoolId: args.schoolId,
          available: true,
        },
        orderBy: [{ featured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
        take: 100,
      }),
      args.studentId
        ? this.prisma.user.findFirst({
            where: { id: args.studentId, schoolId: args.schoolId },
          })
        : Promise.resolve(null),
      this.prisma.order.findMany({
        where: {
          userId: args.userId,
          schoolId: args.schoolId,
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        include: { orderItems: true },
        take: 25,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const studentPreferences = parseJsonArray(studentProfile?.preferences);
    const studentMetadata = studentProfile?.metadata ? JSON.parse(studentProfile.metadata) : {};
    const allergenExclusions = Array.isArray(studentMetadata.allergens)
      ? studentMetadata.allergens.filter((item: unknown) => typeof item === 'string')
      : [];
    const recentlyOrderedItemIds = recentOrders.flatMap(order =>
      order.orderItems.map(item => item.menuItemId)
    );
    const averageOrderValue =
      recentOrders.length > 0
        ? recentOrders.reduce((sum, order) => sum + order.totalAmount, 0) / recentOrders.length
        : undefined;

    const recommendations = this.ruleEngine.recommend(
      menuItems.map(item => ({
        id: item.id,
        allergens: parseJsonArray(item.allergens),
        tags: parseJsonArray(item.tags),
        price: Number(item.price),
        available: item.available,
      })),
      {
        allergenExclusions,
        preferredTags: studentPreferences,
        recentlyOrderedItemIds,
        dismissedIds: [],
        averageOrderValue,
      },
      args.limit ?? 5
    );

    const inputHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ ...args, version: this.ruleEngine.version }))
      .digest('hex');

    const run = await this.prisma.recommendationRun.create({
      data: {
        schoolId: args.schoolId,
        userId: args.userId,
        studentId: args.studentId,
        engineVersion: this.ruleEngine.version,
        mode: 'rule_based',
        inputHash,
        confidence: recommendations[0]?.confidence ?? 0,
        status: 'completed',
        explanation: {
          disclaimer: RECOMMENDATION_DISCLAIMER,
          reasons: recommendations.flatMap(item => item.reasons),
        },
        items: {
          create: recommendations.map(item => ({
            menuItemId: item.menuItemId,
            rank: item.rank,
            score: item.score,
            reasons: item.reasons as unknown as Prisma.InputJsonValue,
          })),
        },
      },
      include: { items: true },
    });

    return {
      runId: run.id,
      recommendations,
      disclaimer: RECOMMENDATION_DISCLAIMER,
    };
  }

  async recordFeedback(args: {
    schoolId: string;
    userId: string;
    recommendationItemId: string;
    action: 'accepted' | 'dismissed' | 'hidden' | 'reported';
    reason?: string;
  }) {
    this.assertEnabled();

    const item = await this.prisma.recommendationItem.findFirst({
      where: {
        id: args.recommendationItemId,
        run: { schoolId: args.schoolId },
      },
    });
    if (!item) {
      throw Object.assign(new Error('Recommendation item not found'), {
        code: 'RECOMMENDATION_NOT_FOUND',
        statusCode: 404,
      });
    }

    const feedback = await this.prisma.recommendationFeedback.create({
      data: {
        schoolId: args.schoolId,
        userId: args.userId,
        recommendationItemId: args.recommendationItemId,
        action: args.action,
        reason: args.reason,
      },
    });

    await this.outboxRepo.enqueue({
      type: 'recommendation.feedback.recorded.v1',
      schoolId: args.schoolId,
      aggregateId: args.recommendationItemId,
      payload: {
        runId: item.runId,
        itemId: args.recommendationItemId,
        action: args.action,
      },
    });

    return feedback;
  }
}
