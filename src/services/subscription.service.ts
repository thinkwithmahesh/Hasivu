import { PrismaClient } from '@prisma/client';
import { featureFlags } from '../config/feature-flags';
import { OutboxRepository } from '../events/outbox.repository';
import { logger } from '../utils/logger';

export class SubscriptionService {
  private static instance: SubscriptionService;
  private readonly outboxRepository: OutboxRepository;

  constructor(private readonly prisma: PrismaClient = new PrismaClient()) {
    this.outboxRepository = new OutboxRepository(prisma);
    logger.info('SubscriptionService initialized');
  }

  static getInstance(): SubscriptionService {
    if (!SubscriptionService.instance) {
      SubscriptionService.instance = new SubscriptionService();
    }
    return SubscriptionService.instance;
  }

  async getUserSubscription(userId: string): Promise<unknown> {
    return this.prisma.subscription.findFirst({
      where: { userId },
      include: { subscriptionPlan: true, billingCycles: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAvailablePlans(schoolId?: string): Promise<unknown[]> {
    return this.prisma.subscriptionPlan.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        isActive: true,
      },
      orderBy: { price: 'asc' },
    });
  }

  async createSubscription(_userId: string, _planId: string): Promise<never> {
    this.assertEnabled();
    throw Object.assign(new Error('Razorpay recurring gateway is not configured for creation'), {
      code: 'MANDATE_AUTH_REQUIRED',
      statusCode: 501,
    });
  }

  async cancelSubscription(userId: string): Promise<void> {
    this.assertEnabled();
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['active', 'past_due', 'pending_mandate'] } },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      throw Object.assign(new Error('Active subscription not found'), {
        code: 'SUBSCRIPTION_NOT_FOUND',
        statusCode: 404,
      });
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancel_pending',
        endDate: subscription.endDate ?? new Date(),
      },
    });
  }

  async checkSubscriptionStatus(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      select: { id: true },
    });
    return Boolean(subscription);
  }

  async markActivatedFromGateway(event: {
    schoolId: string;
    subscriptionId: string;
    previousStatus?: string;
  }) {
    const updated = await this.prisma.subscription.update({
      where: { id: event.subscriptionId },
      data: { status: 'active' },
    });

    await this.outboxRepository.enqueue({
      type: 'subscription.renewal.failed.v1',
      schoolId: event.schoolId,
      aggregateId: event.subscriptionId,
      payload: {
        subscriptionId: event.subscriptionId,
        billingCycleId: 'activation',
        attempt: 0,
      },
    });

    return updated;
  }

  async recordRenewalFailure(event: {
    schoolId: string;
    subscriptionId: string;
    billingCycleId: string;
    attempt: number;
    nextAttemptAt?: string;
  }) {
    await this.outboxRepository.enqueue({
      type: 'subscription.renewal.failed.v1',
      schoolId: event.schoolId,
      aggregateId: event.subscriptionId,
      payload: {
        subscriptionId: event.subscriptionId,
        billingCycleId: event.billingCycleId,
        attempt: event.attempt,
        nextAttemptAt: event.nextAttemptAt,
      },
    });
  }

  private assertEnabled(): void {
    if (!featureFlags.isEnabled('SUBSCRIPTIONS_ENABLED')) {
      throw Object.assign(new Error('Subscriptions are not enabled in this environment'), {
        code: 'FEATURE_DISABLED',
        statusCode: 404,
      });
    }
  }
}

const subscriptionServiceInstance = new SubscriptionService();
export const subscriptionService = subscriptionServiceInstance;
export const _subscriptionService = subscriptionServiceInstance;
export default subscriptionServiceInstance;
