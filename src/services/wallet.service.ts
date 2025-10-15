/**
 * Wallet Service - Stub Implementation
 * TODO: Implement full wallet and payment functionality
 */

import { logger } from '../utils/logger';

export class WalletService {
  constructor() {
    logger.info('WalletService initialized (stub)');
  }

  async getBalance(_userId: string): Promise<number> {
    return 0;
  }

  async addFunds(_userId: string, amount: number): Promise<any> {
    logger.info(`Added ${amount} to wallet for user ${_userId}`);
    return { userId: _userId, amount, balance: amount, timestamp: new Date() };
  }

  async deductFunds(_userId: string, amount: number): Promise<any> {
    logger.info(`Deducted ${amount} from wallet for user ${_userId}`);
    return { userId: _userId, amount, balance: 0, timestamp: new Date() };
  }

  async getTransactionHistory(_userId: string): Promise<any[]> {
    return [];
  }

  async validateSufficientFunds(_userId: string, _amount: number): Promise<boolean> {
    return true;
  }
}

const walletServiceInstance = new WalletService();
export const walletService = walletServiceInstance;
export const _walletService = walletServiceInstance;
export default walletServiceInstance;
