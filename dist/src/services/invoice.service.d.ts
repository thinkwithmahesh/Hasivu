export declare class InvoiceService {
    private static instance;
    constructor();
    static getInstance(): InvoiceService;
    generateInvoice(orderId: string): Promise<any>;
    getInvoice(invoiceId: string): Promise<any>;
}
declare const invoiceServiceInstance: InvoiceService;
export declare const invoiceService: InvoiceService;
export declare const _invoiceService: InvoiceService;
export default invoiceServiceInstance;
//# sourceMappingURL=invoice.service.d.ts.map