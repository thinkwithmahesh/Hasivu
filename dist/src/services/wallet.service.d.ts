export declare class WalletService {
    constructor();
    getBalance(_userId: string): Promise<number>;
    addFunds(_userId: string, amount: number): Promise<any>;
    deductFunds(_userId: string, amount: number): Promise<any>;
    getTransactionHistory(_userId: string): Promise<any[]>;
    validateSufficientFunds(_userId: string, _amount: number): Promise<boolean>;
}
declare const walletServiceInstance: WalletService;
export declare const walletService: WalletService;
export declare const _walletService: WalletService;
export default walletServiceInstance;
//# sourceMappingURL=wallet.service.d.ts.map