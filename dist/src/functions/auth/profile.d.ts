import { APIGatewayProxyResult } from 'aws-lambda';
export interface ProfileRequest {
    userId: string;
}
export declare const handler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export declare const profileHandler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=profile.d.ts.map