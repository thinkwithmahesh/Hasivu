import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare function getRfidCardStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function reportRfidIssue(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare function getIssueReportStatus(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
//# sourceMappingURL=mobile-card-management.d.ts.map