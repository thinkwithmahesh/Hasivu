import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export declare function getSubscriptionAnalytics(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function getSubscriptionDashboard(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function getCohortAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function getRevenueAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function getChurnAnalysis(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function getCustomerLifetimeValue(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=subscription-analytics.d.ts.map