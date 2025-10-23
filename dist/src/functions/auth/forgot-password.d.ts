import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
export interface ForgotPasswordRequest {
    email: string;
}
export declare const handler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export declare const forgotPasswordHandler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=forgot-password.d.ts.map