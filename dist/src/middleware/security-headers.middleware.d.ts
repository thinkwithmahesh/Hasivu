/// <reference types="node" />
/// <reference types="qs" />
/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
export declare const securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
export declare const apiSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const pciComplianceHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const downloadSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const websocketSecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
export declare const devSecurityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
export declare const applySecurityHeaders: (req: Request, res: Response, next: NextFunction) => void;
declare const _default: {
    securityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
    apiSecurityHeaders: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    pciComplianceHeaders: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    downloadSecurityHeaders: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    websocketSecurityHeaders: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    devSecurityHeaders: (req: import("http").IncomingMessage, res: import("http").ServerResponse<import("http").IncomingMessage>, next: (err?: unknown) => void) => void;
    applySecurityHeaders: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
};
export default _default;
//# sourceMappingURL=security-headers.middleware.d.ts.map