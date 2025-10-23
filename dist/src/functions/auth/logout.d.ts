import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
export interface LogoutRequest {
    refreshToken: string;
}
export declare const handler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export declare const logoutHandler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=logout.d.ts.map