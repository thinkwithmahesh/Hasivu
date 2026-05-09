import { Prisma, PrismaClient } from '@prisma/client';
import { OutboxRepository } from '../events/outbox.repository';
import { WalletRepository } from '../repositories/wallet.repository';
import { logger } from '../utils/logger';

export type WalletMutationPayload = {
  walletAccountId: string;
  amount: string;
  referenceType?: string;
  referenceId?: string;
  reason?: string;
  entryType?: string;
  metadata?: Prisma.InputJsonValue;
};

export class WalletService {
  private readonly walletRepository: WalletRepository;
  private readonly outboxRepository: OutboxRepository;

  constructor(private readonly prisma: PrismaClient = new PrismaClient()) {
    this.walletRepository = new WalletRepository(prisma);
    this.outboxRepository = new OutboxRepository(prisma);
  }

  async getOrCreateWallet(schoolId: string, userId: string) {
    const existing = await this.walletRepository.findByUser(schoolId, userId);
    if (existing) {
      return existing;
    }

    return this.walletRepository.createForUser(schoolId, userId);
  }

  async getWalletForUser(args: { schoolId: string; userId: string }) {
    return this.getOrCreateWallet(args.schoolId, args.userId);
  }

  async getLedger(args: { schoolId: string; userId: string; cursor?: string; limit?: number }) {
    return this.walletRepository.getLedger(args.schoolId, args.userId, args.cursor, args.limit);
  }

  async credit(args: {
    schoolId: string;
    actorUserId: string;
    idempotencyKey: string;
    payload: WalletMutationPayload;
  }) {
    const amount = this.parsePositiveAmount(args.payload.amount);

    return this.prisma.$transaction(async tx => {
      const entry = await this.walletRepository.credit(
        args.payload.walletAccountId,
        {
          schoolId: args.schoolId,
          userId: args.actorUserId,
          amount,
          entryType: args.payload.entryType ?? 'adjustment',
          referenceType: args.payload.referenceType,
          referenceId: args.payload.referenceId,
          idempotencyKey: args.idempotencyKey,
          reason: args.payload.reason,
          createdBy: args.actorUserId,
          metadata: args.payload.metadata,
        },
        tx
      );

      await this.outboxRepository.enqueue(
        {
          type: 'wallet.ledger.posted.v1',
          schoolId: args.schoolId,
          aggregateId: args.payload.walletAccountId,
          payload: {
            walletAccountId: args.payload.walletAccountId,
            entryId: entry.id,
            direction: 'credit',
            amount: amount.toString(),
          },
        },
        tx
      );

      return entry;
    });
  }

  async debit(args: {
    schoolId: string;
    actorUserId: string;
    idempotencyKey: string;
    payload: WalletMutationPayload;
  }) {
    const amount = this.parsePositiveAmount(args.payload.amount);

    return this.prisma.$transaction(async tx => {
      const entry = await this.walletRepository.debit(
        args.payload.walletAccountId,
        {
          schoolId: args.schoolId,
          userId: args.actorUserId,
          amount,
          entryType: args.payload.entryType ?? 'order_payment',
          referenceType: args.payload.referenceType,
          referenceId: args.payload.referenceId,
          idempotencyKey: args.idempotencyKey,
          reason: args.payload.reason,
          createdBy: args.actorUserId,
          metadata: args.payload.metadata,
        },
        tx
      );

      await this.outboxRepository.enqueue(
        {
          type: 'wallet.ledger.posted.v1',
          schoolId: args.schoolId,
          aggregateId: args.payload.walletAccountId,
          payload: {
            walletAccountId: args.payload.walletAccountId,
            entryId: entry.id,
            direction: 'debit',
            amount: amount.toString(),
          },
        },
        tx
      );

      return entry;
    });
  }

  async getBalance(userId: string): Promise<number> {
    const wallet = await this.walletRepository.findByUser('global', userId);
    return wallet ? Number(wallet.availableBalance) : 0;
  }

  async addFunds(userId: string, amount: number): Promise<unknown> {
    logger.warn('Legacy WalletService.addFunds called without school scope', { userId });
    const wallet = await this.getOrCreateWallet('global', userId);
    return this.credit({
      schoolId: 'global',
      actorUserId: userId,
      idempotencyKey: `legacy:add:${userId}:${Date.now()}`,
      payload: {
        walletAccountId: wallet.id,
        amount: String(amount),
        entryType: 'legacy_adjustment',
        reason: 'Legacy addFunds compatibility path',
      },
    });
  }

  async deductFunds(userId: string, amount: number): Promise<unknown> {
    logger.warn('Legacy WalletService.deductFunds called without school scope', { userId });
    const wallet = await this.getOrCreateWallet('global', userId);
    return this.debit({
      schoolId: 'global',
      actorUserId: userId,
      idempotencyKey: `legacy:deduct:${userId}:${Date.now()}`,
      payload: {
        walletAccountId: wallet.id,
        amount: String(amount),
        entryType: 'legacy_adjustment',
        reason: 'Legacy deductFunds compatibility path',
      },
    });
  }

  async getTransactionHistory(userId: string): Promise<unknown[]> {
    return this.walletRepository.getLedger('global', userId);
  }

  async validateSufficientFunds(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  private parsePositiveAmount(amount: string): Prisma.Decimal {
    const parsed = new Prisma.Decimal(amount);
    if (parsed.lessThanOrEqualTo(0)) {
      throw Object.assign(new Error('Wallet amount must be positive'), {
        code: 'WALLET_AMOUNT_INVALID',
        statusCode: 400,
      });
    }
    return parsed;
  }
}

const walletServiceInstance = new WalletService();
export const walletService = walletServiceInstance;
export const _walletService = walletServiceInstance;
export default walletServiceInstance;
