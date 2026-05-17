import { PrismaClient } from '@prisma/client';
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth.middleware';
import { requireFeature } from '../middleware/feature-flag.middleware';
import { successResponse } from '../shared/api-response.types';

const prisma = new PrismaClient();
const realtimeRouter = Router();

function requestId(req: AuthenticatedRequest): string {
  return (req as AuthenticatedRequest & { id?: string }).id ?? 'unknown';
}

realtimeRouter.use(requireFeature('REALTIME_ENABLED'));
realtimeRouter.use(authMiddleware);

realtimeRouter.get('/token', (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const secret = process.env.REALTIME_TOKEN_SECRET ?? process.env.JWT_SECRET ?? '';
    const rooms = buildRoomsForUser(user.schoolId ?? 'global', user.id, user.role);
    const token = jwt.sign(
      {
        sub: user.id,
        schoolId: user.schoolId ?? 'global',
        role: user.role,
        rooms,
        jti: uuidv4(),
      },
      secret,
      { expiresIn: '60s' }
    );

    res.json(successResponse({ token, rooms }, requestId(req)));
  } catch (error) {
    next(error);
  }
});

realtimeRouter.get('/events', async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = req.user!;
    const cursor = req.query.cursor ? new Date(String(req.query.cursor)) : undefined;
    const events = await prisma.outboxEvent.findMany({
      where: {
        schoolId: user.schoolId ?? 'global',
        status: 'processed',
        ...(cursor ? { createdAt: { gt: cursor } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    res.json(
      successResponse(
        {
          events,
          nextCursor: events.at(-1)?.createdAt.toISOString(),
        },
        requestId(req)
      )
    );
  } catch (error) {
    next(error);
  }
});

function buildRoomsForUser(schoolId: string, userId: string, role: string): string[] {
  const normalizedRole = role.toLowerCase();
  const rooms = [`user:${userId}`];

  if (['admin', 'school_admin'].includes(normalizedRole)) {
    rooms.push(`school:${schoolId}:admin`);
  }
  if (['kitchen', 'kitchen_staff', 'admin', 'school_admin'].includes(normalizedRole)) {
    rooms.push(`school:${schoolId}:kitchen`);
  }

  return rooms;
}

export default realtimeRouter;
