import { User } from '@prisma/client';
export declare class UserRepository {
    private prisma;
    constructor();
    findAll(filters?: {
        role?: string;
        schoolId?: string;
    }): Promise<User[]>;
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    findBySchool(schoolId: string): Promise<User[]>;
    findByRole(role: string): Promise<User[]>;
    create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
    update(id: string, data: Partial<User>): Promise<User>;
    delete(id: string): Promise<User>;
    search(query: string): Promise<User[]>;
    static findById(id: string): Promise<User | null>;
}
export default UserRepository;
//# sourceMappingURL=user.repository.d.ts.map