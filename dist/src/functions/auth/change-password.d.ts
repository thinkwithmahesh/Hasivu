import { APIGatewayProxyResult } from 'aws-lambda';
export interface ChangePasswordRequest {
    userId: string;
    currentPassword: string;
    newPassword: string;
    newPasswordConfirm: string;
}
export declare const handler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export declare const changePasswordHandler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=change-password.d.ts.map