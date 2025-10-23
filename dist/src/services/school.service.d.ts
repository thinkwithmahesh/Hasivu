import { School } from '@prisma/client';
export interface SchoolFilters {
    search?: string;
    isActive?: boolean;
}
export interface CreateSchoolRequest {
    name: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    email: string;
    principalName: string;
    principalEmail: string;
    principalPhone: string;
    settings?: any;
}
export interface UpdateSchoolRequest {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    principalName?: string;
    principalEmail?: string;
    principalPhone?: string;
    settings?: any;
    isActive?: boolean;
}
export declare class SchoolService {
    private static instance;
    private prisma;
    constructor();
    static getInstance(): SchoolService;
    findById(id: string): Promise<School | null>;
    findAll(filters?: SchoolFilters): Promise<School[]>;
    create(data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School>;
    update(id: string, data: Partial<School>): Promise<School>;
    delete(id: string): Promise<School>;
    createSchool(data: CreateSchoolRequest): Promise<School>;
    static findById(id: string): Promise<School | null>;
    static findAll(filters?: SchoolFilters): Promise<School[]>;
    static create(data: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School>;
    static update(id: string, data: Partial<School>): Promise<School>;
    static delete(id: string): Promise<School>;
    static createSchool(data: CreateSchoolRequest): Promise<School>;
}
export declare const schoolService: SchoolService;
export default SchoolService;
//# sourceMappingURL=school.service.d.ts.map