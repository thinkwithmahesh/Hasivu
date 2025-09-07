import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare const getMobileTrackingHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const updateTrackingStatusHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const handler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
declare const _default: {
    getMobileTrackingHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
    updateTrackingStatusHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
};
export default _default;
//# sourceMappingURL=mobile-tracking.d.ts.map