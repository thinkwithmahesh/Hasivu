import { APIGatewayProxyResult } from 'aws-lambda';
export interface UpdateProfileRequest {
    userId: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}
export declare const handler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export declare const updateProfileHandler: (event: any, _context: any) => Promise<APIGatewayProxyResult>;
export default handler;
//# sourceMappingURL=update-profile.d.ts.map