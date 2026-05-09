import { Prisma, PrismaClient } from '@prisma/client';

type WalletTx = Prisma.TransactionClient;

export type WalletLedgerCommand = {
  schoolId: string;
  userId: string;
  amount: Prisma.Decimal;
  entryType: string;
  referenceType?: string;
  referenceId?: string;
  idempotencyKey: string;
  reason?: string;
  createdBy?: string;
  metadata?: Prisma.InputJsonValue;
};

export class WalletRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByUser(schoolId: string, userId: string, currency = 'INR') {
    return this.prisma.walletAccount.findUnique({
      where: {
        schoolId_userId_currency: {
          schoolId,
          userId,
          currency,
        },
      },
    });
  }

  async createForUser(schoolId: string, userId: string, currency = 'INR') {
    return this.prisma.walletAccount.create({
      data: {
        schoolId,
        userId,
        currency,
      },
    });
  }

  async credit(walletAccountId: string, command: WalletLedgerCommand, tx: WalletTx) {
    const amount = command.amount;
    await tx.walletAccount.update({
      where: { id: walletAccountId },
      data: {
        availableBalance: { increment: amount },
        version: { increment: 1 },
      },
    });

    const wallet = await tx.walletAccount.findUniqueOrThrow({
      where: { id: walletAccountId },
    });

    return tx.walletLedgerEntry.create({
      data: {
        walletAccountId,
        schoolId: command.schoolId,
        userId: command.userId,
        direction: 'credit',
        entryType: command.entryType,
        amount,
        currency: wallet.currency,
        balanceAfter: wallet.availableBalance,
        status: 'posted',
        referenceType: command.referenceType,
        referenceId: command.referenceId,
        idempotencyKey: command.idempotencyKey,
        reason: command.reason,
        createdBy: command.createdBy,
        metadata: command.metadata,
      },
    });
  }

  async debit(walletAccountId: string, command: WalletLedgerCommand, tx: WalletTx) {
    const amount = command.amount;
    const updated = await tx.walletAccount.updateMany({
      where: {
        id: walletAccountId,
        status: 'active',
        availableBalance: { gte: amount },
      },
      data: {
        availableBalance: { decrement: amount },
        version: { increment: 1 },
      },
    });

    if (updated.count !== 1) {
      throw Object.assign(new Error('Insufficient wallet balance'), {
        code: 'WALLET_INSUFFICIENT_FUNDS',
        statusCode: 402,
      });
    }

    const wallet = await tx.walletAccount.findUniqueOrThrow({
      where: { id: walletAccountId },
    });

    return tx.walletLedgerEntry.create({
      data: {
        walletAccountId,
        schoolId: command.schoolId,
        userId: command.userId,
        direction: 'debit',
        entryType: command.entryType,
        amount,
        currency: wallet.currency,
        balanceAfter: wallet.availableBalance,
        status: 'posted',
        referenceType: command.referenceType,
        referenceId: command.referenceId,
        idempotencyKey: command.idempotencyKey,
        reason: command.reason,
        createdBy: command.createdBy,
        metadata: command.metadata,
      },
    });
  }

  async getLedger(schoolId: string, userId: string, cursor?: string, limit = 20) {
    return this.prisma.walletLedgerEntry.findMany({
      where: { schoolId, userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 100),
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }
}
