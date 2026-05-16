import { PrismaClient, Prisma } from '@prisma/client';
import { Router } from 'express';
import { authMiddleware, AuthenticatedRequest, requireRole } from '../middleware/auth.middleware';
import { successResponse } from '../shared/api-response.types';
import { WhatsAppCloudApiClient } from '../integrations/whatsapp/cloud-api.client';
import { WhatsAppService } from '../services/whatsapp.service';

const prisma = new PrismaClient();
const whatsappService = new WhatsAppService(prisma);
const whatsappClient = new WhatsAppCloudApiClient();
const whatsappRouter = Router();

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

whatsappRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    res.status(200).send(challenge);
    return;
  }

  res.sendStatus(403);
});

whatsappRouter.post('/webhook', async (req, res, next) => {
  try {
    const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
    const signature = req.header('x-hub-signature-256');

    if (!whatsappClient.verifyWebhookSignature(rawBody, signature)) {
      res.sendStatus(403);
      return;
    }

    const statuses =
      req.body?.entry?.flatMap((entry: any) =>
        entry.changes?.flatMap((change: any) => change.value?.statuses ?? [])
      ) ?? [];

    for (const status of statuses) {
      await whatsappService.recordProviderStatus({
        providerMessageId: status.id,
        status: status.status,
        occurredAt: status.timestamp ? new Date(Number(status.timestamp) * 1000) : new Date(),
        providerPayload: status as Prisma.InputJsonValue,
      });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

whatsappRouter.use(authMiddleware);

whatsappRouter.get(
  '/status',
  requireRole(['school_admin', 'admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const status = await whatsappService.getIntegrationStatus(user.schoolId ?? 'global');
      res.json(successResponse(status, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

whatsappRouter.get(
  '/templates',
  requireRole(['school_admin', 'admin']),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const templates = await whatsappService.listTemplates(user.schoolId ?? 'global');
      res.json(successResponse(templates, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

whatsappRouter.post('/opt-in', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const optIn = await whatsappService.captureOptIn({
      schoolId: user.schoolId ?? 'global',
      userId: user.id,
      phone: req.body.phone,
      consentText: req.body.consentText,
      consentVersion: req.body.consentVersion,
      source: req.body.source ?? 'settings',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
    });

    res.status(201).json(successResponse(optIn, requestId(req)));
  } catch (error) {
    next(error);
  }
});

whatsappRouter.post('/opt-out', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const result = await whatsappService.revokeOptIn({
      schoolId: user.schoolId ?? 'global',
      userId: user.id,
      phone: req.body.phone,
    });

    res.json(successResponse(result, requestId(req)));
  } catch (error) {
    next(error);
  }
});

whatsappRouter.get('/messages', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const isAdmin = ['admin', 'school_admin', 'super_admin'].includes(user.role);
    const messages = await whatsappService.listMessages(
      user.schoolId ?? 'global',
      isAdmin ? undefined : user.id
    );
    res.json(successResponse(messages, requestId(req)));
  } catch (error) {
    next(error);
  }
});

whatsappRouter.post(
  '/templates/:eventType/trigger',
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const result = await whatsappService.triggerMessage({
        schoolId: user.schoolId ?? 'global',
        recipientUserId: req.body.recipientUserId,
        eventType: req.params.eventType,
        variables: req.body.variables ?? {},
        fallbackRequired: req.body.fallbackRequired !== false,
      });

      res.status(202).json(successResponse(result, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

export default whatsappRouter;
