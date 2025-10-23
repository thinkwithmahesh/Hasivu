import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare const getPaymentMethods: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const createPaymentMethod: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const updatePaymentMethod: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const deletePaymentMethod: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=manage-payment-methods.d.ts.map