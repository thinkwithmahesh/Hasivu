import { z } from 'zod';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
export interface ValidationResult<T = any> {
    success: boolean;
    data?: T;
    errors?: ValidationError[];
    sanitizedData?: T;
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
    value?: any;
    path?: string[];
}
export interface ValidationOptions {
    sanitize?: boolean;
    allowUnknown?: boolean;
    stripUnknown?: boolean;
    abortEarly?: boolean;
    customErrorMessages?: Record<string, string>;
    skipBodyParsing?: boolean;
}
export interface SanitizationOptions {
    trimStrings?: boolean;
    removeNullUndefined?: boolean;
    normalizeEmail?: boolean;
    escapeHtml?: boolean;
    removeXSS?: boolean;
}
export declare const CommonSchemas: {
    email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
    phone: z.ZodString;
    password: z.ZodString;
    uuid: z.ZodString;
    objectId: z.ZodString;
    positiveInt: z.ZodNumber;
    nonNegativeInt: z.ZodNumber;
    url: z.ZodString;
    dateString: z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>;
    businessName: z.ZodString;
    address: z.ZodObject<{
        street: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        country: z.ZodString;
    }, z.core.$strip>;
    pagination: z.ZodObject<{
        page: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        sortBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        sortOrder: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
            desc: "desc";
            asc: "asc";
        }>>>;
    }, z.core.$strip>;
    fileUpload: z.ZodObject<{
        filename: z.ZodString;
        mimeType: z.ZodString;
        size: z.ZodNumber;
        content: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>;
    paymentAmount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodEnum<{
        INR: "INR";
        USD: "USD";
        EUR: "EUR";
        GBP: "GBP";
        CAD: "CAD";
        AUD: "AUD";
    }>>;
};
export declare const validateRequest: <T>(schema: z.ZodSchema<T>, event: APIGatewayProxyEvent, options?: ValidationOptions) => ValidationResult<T>;
export declare const validateBody: <T>(schema: z.ZodSchema<T>, event: APIGatewayProxyEvent, options?: ValidationOptions) => ValidationResult<T>;
export declare const validateQuery: <T>(schema: z.ZodSchema<T>, event: APIGatewayProxyEvent, options?: ValidationOptions) => ValidationResult<T>;
export declare const validatePath: <T>(schema: z.ZodSchema<T>, event: APIGatewayProxyEvent, options?: ValidationOptions) => ValidationResult<T>;
export declare const createValidationErrorResponse: (errors: ValidationError[], statusCode?: number) => APIGatewayProxyResult;
export declare const withValidation: <T>(schema: z.ZodSchema<T>, handler: (event: APIGatewayProxyEvent, validatedData: T) => Promise<APIGatewayProxyResult>, options?: ValidationOptions) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const withAuthAndValidation: <T>(schema: z.ZodSchema<T>, handler: (event: APIGatewayProxyEvent, validatedData: T, user: any) => Promise<APIGatewayProxyResult>, validationOptions?: ValidationOptions) => (event: APIGatewayProxyEvent) => Promise<APIGatewayProxyResult>;
export declare const validationHealthCheck: () => {
    status: 'healthy' | 'unhealthy';
    details: any;
};
export declare const HASIVUSchemas: {
    userRegistration: z.ZodObject<{
        email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        password: z.ZodString;
        businessName: z.ZodString;
        phone: z.ZodString;
        firstName: z.ZodString;
        lastName: z.ZodString;
        acceptTerms: z.ZodBoolean;
    }, z.core.$strip>;
    userLogin: z.ZodObject<{
        email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        password: z.ZodString;
        rememberMe: z.ZodOptional<z.ZodBoolean>;
    }, z.core.$strip>;
    businessProfile: z.ZodObject<{
        businessName: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        phone: z.ZodString;
        email: z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>;
        address: z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            zipCode: z.ZodString;
            country: z.ZodString;
        }, z.core.$strip>;
        website: z.ZodOptional<z.ZodString>;
        category: z.ZodString;
    }, z.core.$strip>;
    menuItem: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodOptional<z.ZodString>;
        price: z.ZodNumber;
        currency: z.ZodDefault<z.ZodEnum<{
            INR: "INR";
            USD: "USD";
            EUR: "EUR";
            GBP: "GBP";
            CAD: "CAD";
            AUD: "AUD";
        }>>;
        category: z.ZodString;
        available: z.ZodDefault<z.ZodBoolean>;
        preparationTime: z.ZodOptional<z.ZodNumber>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString>>;
        allergens: z.ZodOptional<z.ZodArray<z.ZodString>>;
    }, z.core.$strip>;
    orderCreation: z.ZodObject<{
        items: z.ZodArray<z.ZodObject<{
            menuItemId: z.ZodString;
            quantity: z.ZodNumber;
            specialInstructions: z.ZodOptional<z.ZodString>;
        }, z.core.$strip>>;
        customerInfo: z.ZodObject<{
            name: z.ZodString;
            phone: z.ZodString;
            email: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<string, string>>>;
        }, z.core.$strip>;
        deliveryAddress: z.ZodOptional<z.ZodObject<{
            street: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            zipCode: z.ZodString;
            country: z.ZodString;
        }, z.core.$strip>>;
        notes: z.ZodOptional<z.ZodString>;
        scheduledFor: z.ZodOptional<z.ZodPipe<z.ZodString, z.ZodTransform<Date, string>>>;
    }, z.core.$strip>;
    paymentProcessing: z.ZodObject<{
        orderId: z.ZodString;
        amount: z.ZodNumber;
        currency: z.ZodDefault<z.ZodEnum<{
            INR: "INR";
            USD: "USD";
            EUR: "EUR";
            GBP: "GBP";
            CAD: "CAD";
            AUD: "AUD";
        }>>;
        paymentMethod: z.ZodEnum<{
            razorpay: "razorpay";
            cash: "cash";
            stripe: "stripe";
        }>;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>;
    paginationWithSearch: z.ZodObject<{
        page: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        limit: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
        sortBy: z.ZodOptional<z.ZodOptional<z.ZodString>>;
        sortOrder: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
            desc: "desc";
            asc: "asc";
        }>>>;
        search: z.ZodOptional<z.ZodString>;
        filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, z.core.$strip>;
};
//# sourceMappingURL=validation.d.ts.map