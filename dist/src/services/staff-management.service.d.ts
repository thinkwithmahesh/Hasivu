export declare class StaffManagementService {
    constructor();
    getStaffSchedule(): Promise<any[]>;
    updateStaffStatus(staffId: string, status: string): Promise<void>;
    getAvailableStaff(): Promise<any[]>;
    getCurrentStaffStatus(_schoolId: string): Promise<any>;
}
declare const staffManagementServiceInstance: StaffManagementService;
export declare const staffManagementService: StaffManagementService;
export declare const _staffManagementService: StaffManagementService;
export default staffManagementServiceInstance;
//# sourceMappingURL=staff-management.service.d.ts.map