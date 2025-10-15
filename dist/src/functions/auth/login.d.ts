import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
export interface LoginRequest {
    email: string;
    password: string;
}
export declare const handler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export declare const loginHandler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=login.d.ts.map