/// <reference types="qs" />
/// <reference types="cookie-parser" />
import { Request, Response, NextFunction } from 'express';
export interface ValidationRule {
    type: 'string' | 'email' | 'phone' | 'uuid' | 'number' | 'boolean' | 'date' | 'array' | 'object';
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: string[];
    custom?: (value: any) => boolean;
    arrayItemType?: ValidationRule;
    objectSchema?: {
        [key: string]: ValidationRule;
    };
}
export interface ValidationSchema {
    [key: string]: ValidationRule;
}
export declare const sanitizeMongoInput: import("express").Handler;
export declare const sanitizeXSS: (req: any, res: any, next: any) => void;
export declare const customSanitizer: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sqlInjectionProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const pathTraversalProtection: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateBody: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateQuery: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const validateParams: (schema: ValidationSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const sanitizeInput: (req: Request, res: Response, next: NextFunction) => void;
export declare const validationRateLimit: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const comprehensiveInputValidation: ((req: Request, res: Response, next: NextFunction) => void)[];
declare const _default: {
    validateBody: (schema: ValidationSchema) => (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateQuery: (schema: ValidationSchema) => (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validateParams: (schema: ValidationSchema) => (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    sanitizeInput: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void;
    sanitizeMongoInput: import("express").Handler;
    sanitizeXSS: (req: any, res: any, next: any) => void;
    customSanitizer: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    sqlInjectionProtection: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    pathTraversalProtection: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    validationRateLimit: (req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => Response<any, Record<string, any>> | undefined;
    comprehensiveInputValidation: ((req: Request<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>>, next: NextFunction) => void)[];
};
export default _default;
//# sourceMappingURL=input-validation.middleware.d.ts.map