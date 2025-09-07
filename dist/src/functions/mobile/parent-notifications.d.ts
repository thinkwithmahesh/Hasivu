import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare enum NotificationType {
    DELIVERY_CONFIRMATION = "delivery_confirmation",
    ORDER_READY = "order_ready",
    ORDER_OUT_FOR_DELIVERY = "order_out_for_delivery",
    DELIVERY_FAILED = "delivery_failed",
    CARD_ISSUE = "card_issue",
    ACCOUNT_UPDATE = "account_update",
    PAYMENT_REMINDER = "payment_reminder",
    WEEKLY_SUMMARY = "weekly_summary"
}
export declare function sendDeliveryConfirmation(parentId: string, studentName: string, orderNumber: string, deliveryLocation: string, deliveryTime: Date): Promise<void>;
export declare const parentNotificationsHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=parent-notifications.d.ts.map