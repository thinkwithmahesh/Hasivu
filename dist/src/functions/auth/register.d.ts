import { APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
export interface RegisterRequest {
    email: string;
    password: string;
    passwordConfirm: string;
    firstName: string;
    lastName: string;
    role?: string;
    schoolId?: string;
}
export declare const handler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export declare const registerHandler: (event: APIGatewayProxyEvent, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=register.d.ts.map