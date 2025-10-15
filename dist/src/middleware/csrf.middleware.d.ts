/// <reference types="cookie-parser" />
/// <reference types="qs" />
import { Request, Response, NextFunction } from 'express';
export interface CSRFRequest extends Request {
    csrfToken?: string;
    sessionId?: string;
}
export interface CSRFConfig {
    ignoreMethods?: string[];
    customHeaderName?: string;
    skipPaths?: string[];
    errorMessage?: string;
}
export declare const csrfProtection: (config?: CSRFConfig) => (req: CSRFRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const attachCSRFToken: (req: CSRFRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const doubleSubmitCSRF: (config?: CSRFConfig) => (req: CSRFRequest, res: Response, next: NextFunction) => void;
export declare const sameSiteCSRF: (req: Request, res: Response, next: NextFunction) => void;
export declare const enhancedCSRFProtection: (config?: CSRFConfig) => (((req: CSRFRequest, res: Response, next: NextFunction) => Promise<void>) | ((req: Request, res: Response, next: NextFunction) => void))[];
export declare const getCSRFToken: (req: Request, res: Response) => Promise<void>;
declare const _default: {
    csrfProtection: (config?: CSRFConfig) => (req: CSRFRequest, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>;
    attachCSRFToken: (req: CSRFRequest, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>;
    doubleSubmitCSRF: (config?: CSRFConfig) => (req: CSRFRequest, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    sameSiteCSRF: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    enhancedCSRFProtection: (config?: CSRFConfig) => (((req: CSRFRequest, res: Response<any, Record<string, any>>, next: NextFunction) => Promise<void>) | ((req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void))[];
    getCSRFToken: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>) => Promise<void>;
};
export default _default;
//# sourceMappingURL=csrf.middleware.d.ts.map