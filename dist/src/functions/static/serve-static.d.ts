import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
export declare const serveStaticContentHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const serveHealthDashboardHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
export declare const listStaticFilesHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
declare const _default: {
    serveStaticContentHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
    serveHealthDashboardHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
    listStaticFilesHandler: (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
};
export default _default;
//# sourceMappingURL=serve-static.d.ts.map