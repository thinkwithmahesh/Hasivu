import { Prisma, PrismaClient } from '@prisma/client';
import { DomainEvent } from './domain-events';

type PrismaLikeClient = PrismaClient | Prisma.TransactionClient;

export class OutboxRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async enqueue(event: DomainEvent, tx?: Prisma.TransactionClient): Promise<void> {
    const db: PrismaLikeClient = tx ?? this.prisma;

    await db.outboxEvent.create({
      data: {
        schoolId: event.schoolId,
        eventType: event.type,
        aggregateType: event.type.split('.')[0] ?? 'unknown',
        aggregateId: event.aggregateId,
        payload: event.payload as Prisma.InputJsonValue,
        status: 'pending',
        nextAttemptAt: new Date(),
      },
    });
  }

  async claimPending(limit = 50) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: 'pending',
        nextAttemptAt: { lte: new Date() },
        attempts: { lt: 5 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markProcessed(id: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: 'processed',
        processedAt: new Date(),
      },
    });
  }

  async markFailed(id: string, error: string, nextAttemptAt?: Date): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: nextAttemptAt ? 'pending' : 'dead_letter',
        lastError: error,
        attempts: { increment: 1 },
        nextAttemptAt,
      },
    });
  }
}
