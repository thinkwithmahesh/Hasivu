import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare const serveStaticContentHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const healthCheckHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
declare const _default: {
    serveStaticContentHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
    healthCheckHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
};
export default _default;
//# sourceMappingURL=serve-content.d.ts.map