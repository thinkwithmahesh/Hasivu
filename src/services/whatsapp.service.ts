import { Prisma, PrismaClient } from '@prisma/client';
import { featureFlags } from '../config/feature-flags';
import { OutboxRepository } from '../events/outbox.repository';
import { WhatsAppCloudApiClient } from '../integrations/whatsapp/cloud-api.client';
import { logger } from '../utils/logger';

export type WhatsAppTrigger = {
  schoolId: string;
  recipientUserId: string;
  eventType: string;
  variables: Record<string, string>;
  fallbackRequired: boolean;
};

export class WhatsAppService {
  private readonly client: WhatsAppCloudApiClient;
  private readonly outboxRepository: OutboxRepository;

  constructor(private readonly prisma: PrismaClient = new PrismaClient()) {
    this.client = new WhatsAppCloudApiClient();
    this.outboxRepository = new OutboxRepository(prisma);
  }

  async captureOptIn(args: {
    schoolId: string;
    userId: string;
    phone: string;
    consentText: string;
    consentVersion: string;
    source: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.whatsAppOptIn.upsert({
      where: {
        schoolId_userId_phone: {
          schoolId: args.schoolId,
          userId: args.userId,
          phone: args.phone,
        },
      },
      update: {
        status: 'active',
        consentText: args.consentText,
        consentVersion: args.consentVersion,
        source: args.source,
        ipAddress: args.ipAddress,
        userAgent: args.userAgent,
        revokedAt: null,
      },
      create: args,
    });
  }

  async revokeOptIn(args: { schoolId: string; userId: string; phone: string }) {
    return this.prisma.whatsAppOptIn.updateMany({
      where: {
        schoolId: args.schoolId,
        userId: args.userId,
        phone: args.phone,
        status: 'active',
      },
      data: {
        status: 'revoked',
        revokedAt: new Date(),
      },
    });
  }

  async triggerMessage(
    args: WhatsAppTrigger
  ): Promise<{ status: string; channel: string; messageId: string }> {
    const mode = featureFlags.get('WHATSAPP_MODE');
    const user = await this.prisma.user.findUnique({
      where: { id: args.recipientUserId },
      select: { phone: true },
    });

    const message = await this.prisma.whatsAppMessage.create({
      data: {
        schoolId: args.schoolId,
        userId: args.recipientUserId,
        phone: user?.phone ?? 'unavailable',
        type: args.eventType,
        status: 'queued',
        message: JSON.stringify(args.variables),
        metadata: JSON.stringify({ fallbackRequired: args.fallbackRequired }),
      },
    });

    if (mode !== 'production') {
      await this.scheduleFallback(args.schoolId, message.id, 'email', `whatsapp_${mode}`);
      return { status: 'fallback_scheduled', channel: 'email', messageId: message.id };
    }

    const optIn = await this.prisma.whatsAppOptIn.findFirst({
      where: {
        schoolId: args.schoolId,
        userId: args.recipientUserId,
        status: 'active',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!optIn) {
      await this.scheduleFallback(args.schoolId, message.id, 'email', 'missing_opt_in');
      return { status: 'no_opt_in', channel: 'email', messageId: message.id };
    }

    const template = await this.prisma.whatsAppTemplateMapping.findFirst({
      where: {
        eventType: args.eventType,
        language: 'en',
        isActive: true,
        status: 'approved',
        OR: [{ schoolId: args.schoolId }, { schoolId: null }],
      },
      orderBy: { schoolId: 'desc' },
    });

    if (!template) {
      await this.scheduleFallback(args.schoolId, message.id, 'email', 'template_unavailable');
      return { status: 'template_unavailable', channel: 'email', messageId: message.id };
    }

    try {
      const result = await this.client.sendTemplate({
        recipientPhone: optIn.phone,
        templateName: template.templateName,
        language: template.language,
        variables: args.variables,
      });

      await this.prisma.whatsAppMessage.update({
        where: { id: message.id },
        data: {
          status: 'sent',
          whatsappMessageId: result.messageId,
          templateName: template.templateName,
          sentAt: new Date(),
        },
      });

      return { status: 'sent', channel: 'whatsapp', messageId: message.id };
    } catch (error) {
      logger.error('WhatsApp send failed; scheduling fallback', error as Error, {
        schoolId: args.schoolId,
        messageId: message.id,
      });
      await this.scheduleFallback(args.schoolId, message.id, 'email', 'provider_failure');
      return { status: 'failed_fallback', channel: 'email', messageId: message.id };
    }
  }

  async recordProviderStatus(args: {
    providerMessageId: string;
    status: string;
    occurredAt: Date;
    providerPayload?: Prisma.InputJsonValue;
  }) {
    const data: Prisma.WhatsAppMessageUpdateManyMutationInput = {
      status: args.status,
      providerPayload: args.providerPayload,
    };

    if (args.status === 'delivered') {
      data.deliveredAt = args.occurredAt;
    }
    if (args.status === 'read') {
      data.readAt = args.occurredAt;
    }
    if (args.status === 'failed') {
      data.failedAt = args.occurredAt;
    }

    return this.prisma.whatsAppMessage.updateMany({
      where: { whatsappMessageId: args.providerMessageId },
      data,
    });
  }

  async listMessages(schoolId: string, userId?: string) {
    return this.prisma.whatsAppMessage.findMany({
      where: {
        schoolId,
        ...(userId ? { userId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getIntegrationStatus(schoolId: string) {
    const [messagesSent, lastMessage, activeOptIns] = await Promise.all([
      this.prisma.whatsAppMessage.count({ where: { schoolId } }),
      this.prisma.whatsAppMessage.findFirst({
        where: { schoolId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.whatsAppOptIn.count({ where: { schoolId, status: 'active' } }),
    ]);

    const mode = featureFlags.get('WHATSAPP_MODE');
    return {
      mode,
      connected: mode === 'production' && Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID),
      phoneNumber: process.env.WHATSAPP_PHONE_NUMBER_ID || null,
      businessName: process.env.WHATSAPP_BUSINESS_NAME || 'HASIVU Platform',
      qualityRating: 'unknown',
      messageLimit: Number(process.env.WHATSAPP_DAILY_MESSAGE_LIMIT || 0),
      messagesSent,
      activeOptIns,
      lastActivity: lastMessage?.createdAt?.toISOString() ?? null,
    };
  }

  async listTemplates(schoolId: string) {
    return this.prisma.whatsAppTemplateMapping.findMany({
      where: {
        isActive: true,
        OR: [{ schoolId }, { schoolId: null }],
      },
      orderBy: [{ schoolId: 'desc' }, { eventType: 'asc' }],
    });
  }

  private async scheduleFallback(
    schoolId: string,
    messageId: string,
    channel: 'email' | 'in_app' | 'sms',
    reason: string
  ) {
    await this.prisma.whatsAppMessage.update({
      where: { id: messageId },
      data: {
        status: 'fallback_scheduled',
        fallbackChannel: channel,
        fallbackTriggeredAt: new Date(),
        errorMessage: reason,
      },
    });

    await this.outboxRepository.enqueue({
      type: 'whatsapp.message.failed.v1',
      schoolId,
      aggregateId: messageId,
      payload: {
        messageId,
        reason,
        fallbackChannel: channel,
      },
    });
  }
}
