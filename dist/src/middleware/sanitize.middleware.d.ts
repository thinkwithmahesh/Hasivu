/// <reference types="qs" />
/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
export declare const sanitizeMongoInput: import("express").Handler;
export declare const sanitizeXSS: (req: any, res: any, next: any) => void;
export declare const customSanitizer: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sqlInjectionProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const pathTraversalProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sanitizeInput: (import("express").Handler | ((req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
declare const _default: {
    sanitizeMongoInput: import("express").Handler;
    sanitizeXSS: (req: any, res: any, next: any) => void;
    customSanitizer: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    sqlInjectionProtection: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    pathTraversalProtection: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    sanitizeInput: (import("express").Handler | ((req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined))[];
};
export default _default;
//# sourceMappingURL=sanitize.middleware.d.ts.map