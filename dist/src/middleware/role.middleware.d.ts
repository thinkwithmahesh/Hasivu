import { Request, Response, NextFunction } from 'express';
export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        schoolId?: string;
        permissions?: string[];
    };
}
export declare const roleMiddleware: (allowedRoles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const permissionMiddleware: (requiredPermissions: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const adminOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const schoolStaffOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const parentOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const studentOnly: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=role.middleware.d.ts.map