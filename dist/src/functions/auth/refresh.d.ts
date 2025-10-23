import { APIGatewayProxyResult } from 'aws-lambda';
export interface RefreshRequest {
    refreshToken: string;
}
export declare const handler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export declare const refreshHandler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=refresh.d.ts.map