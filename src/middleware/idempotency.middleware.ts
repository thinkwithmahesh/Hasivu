import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { errorResponse } from '../shared/api-response.types';

type RequestWithPhase2State = Request & {
  id?: string;
  idempotencyKey?: string;
  idempotencyRecord?: unknown;
  user?: { schoolId?: string };
};

function getRequestId(req: Request): string {
  return (req as RequestWithPhase2State).id ?? 'unknown';
}

function stableBodyHash(body: unknown): string {
  return crypto
    .createHash('sha256')
    .update(JSON.stringify(body ?? {}))
    .digest('hex');
}

export function requireIdempotencyKey(prisma: PrismaClient) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = req.header('Idempotency-Key')?.trim();
    const requestId = getRequestId(req);

    if (!key) {
      res
        .status(400)
        .json(
          errorResponse(
            'IDEMPOTENCY_KEY_REQUIRED',
            'Idempotency-Key header is required for this operation.',
            requestId
          )
        );
      return;
    }

    const schoolId = (req as RequestWithPhase2State).user?.schoolId ?? 'global';
    const operation = `${req.method}:${req.path}`;
    const requestHash = stableBodyHash(req.body);

    try {
      const existing = await prisma.paymentIdempotencyKey.findUnique({
        where: {
          schoolId_key_operation: {
            schoolId,
            key,
            operation,
          },
        },
      });

      if (existing) {
        if (existing.requestHash !== requestHash) {
          res
            .status(422)
            .json(
              errorResponse(
                'IDEMPOTENCY_CONFLICT',
                'The same idempotency key was used with a different request body.',
                requestId
              )
            );
          return;
        }

        if (existing.status === 'completed' && existing.responseBody) {
          res.status(200).json({
            ...(existing.responseBody as Record<string, unknown>),
            idempotent: true,
          });
          return;
        }
      }

      (req as RequestWithPhase2State).idempotencyKey = key;
      (req as RequestWithPhase2State).idempotencyRecord = existing;
      next();
    } catch (error) {
      next(error);
    }
  };
}
