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
export declare const validateSchoolAccess: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
export declare const validateSchoolOwnership: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const validateCrossSchoolAccess: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=school-access.middleware.d.ts.map