import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import { featureFlags } from '../config/feature-flags';
import { errorResponse, successResponse } from '../shared/api-response.types';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { requireIdempotencyKey } from '../middleware/idempotency.middleware';
import { WalletService } from '../services/wallet.service';

const prisma = new PrismaClient();
const walletService = new WalletService(prisma);
const walletRouter = Router();

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

walletRouter.use(authMiddleware);
walletRouter.use(requireFeature('WALLET_ENABLED'));

walletRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const wallet = await walletService.getWalletForUser({
      schoolId: user.schoolId ?? 'global',
      userId: user.id,
    });
    res.json(successResponse(wallet, requestId(req)));
  } catch (error) {
    next(error);
  }
});

walletRouter.get('/ledger', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const ledger = await walletService.getLedger({
      schoolId: user.schoolId ?? 'global',
      userId: user.id,
      cursor: typeof req.query.cursor === 'string' ? req.query.cursor : undefined,
      limit: typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined,
    });
    res.json(successResponse(ledger, requestId(req)));
  } catch (error) {
    next(error);
  }
});

walletRouter.post(
  '/credits',
  requireIdempotencyKey(prisma),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      if (!['admin', 'school_admin', 'super_admin'].includes(user.role)) {
        res
          .status(403)
          .json(errorResponse('FORBIDDEN', 'Only admins can credit wallets.', requestId(req)));
        return;
      }

      const entry = await walletService.credit({
        schoolId: user.schoolId ?? 'global',
        actorUserId: user.id,
        idempotencyKey: (req as AuthenticatedRequest & { idempotencyKey: string }).idempotencyKey,
        payload: req.body,
      });

      res.status(201).json(successResponse(entry, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

walletRouter.post(
  '/debits',
  requireIdempotencyKey(prisma),
  async (req: AuthenticatedRequest, res, next) => {
    try {
      const user = req.user!;
      const entry = await walletService.debit({
        schoolId: user.schoolId ?? 'global',
        actorUserId: user.id,
        idempotencyKey: (req as AuthenticatedRequest & { idempotencyKey: string }).idempotencyKey,
        payload: req.body,
      });

      res.status(201).json(successResponse(entry, requestId(req)));
    } catch (error) {
      next(error);
    }
  }
);

walletRouter.get('/status', (_req, res) => {
  res.json({
    success: true,
    data: {
      enabled: featureFlags.isEnabled('WALLET_ENABLED'),
      mode: featureFlags.get('WALLET_ENABLED') ? 'active' : 'disabled',
    },
    requestId: 'status',
  });
});

export default walletRouter;
