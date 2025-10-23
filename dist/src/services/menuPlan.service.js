"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuPlanService = exports.MenuPlanService = exports.MenuPlanStatus = void 0;
const client_1 = require("@prisma/client");
var MenuPlanStatus;
(function (MenuPlanStatus) {
    MenuPlanStatus["DRAFT"] = "DRAFT";
    MenuPlanStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    MenuPlanStatus["APPROVED"] = "APPROVED";
    MenuPlanStatus["PUBLISHED"] = "PUBLISHED";
    MenuPlanStatus["ARCHIVED"] = "ARCHIVED";
})(MenuPlanStatus || (exports.MenuPlanStatus = MenuPlanStatus = {}));
class MenuPlanService {
    static instance;
    prisma;
    constructor() {
        this.prisma = new client_1.PrismaClient();
    }
    static getInstance() {
        if (!MenuPlanService.instance) {
            MenuPlanService.instance = new MenuPlanService();
        }
        return MenuPlanService.instance;
    }
    async create(data) {
        return {
            id: `plan_${Date.now()}`,
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async findById(_id) {
        return null;
    }
    async findBySchool(_schoolId) {
        return [];
    }
    async findActiveBySchool(_schoolId, _date) {
        const _targetDate = _date || new Date();
        return null;
    }
    async update(id, data) {
        return {
            id,
            ...data,
            updatedAt: new Date(),
        };
    }
    async delete(id) {
        return { id, deleted: true };
    }
    async activate(id) {
        return await this.update(id, { isActive: true });
    }
    async deactivate(id) {
        return await this.update(id, { isActive: false });
    }
    async getMenuForDate(schoolId, date, mealType) {
        const plan = await this.findActiveBySchool(schoolId, date);
        if (!plan || !plan.items) {
            return [];
        }
        if (mealType) {
            return plan.items.filter((item) => item.mealType === mealType);
        }
        return plan.items;
    }
    async existsForDateRange(_schoolId, _startDate, _endDate) {
        return false;
    }
    async clone(planId, startDate, endDate) {
        const originalPlan = await this.findById(planId);
        if (!originalPlan) {
            throw new Error('Menu plan not found');
        }
        return await this.create({
            ...originalPlan,
            name: `${originalPlan.name} (Copy)`,
            startDate,
            endDate,
            isActive: false,
        });
    }
    static async createMenuPlan(data) {
        const instance = MenuPlanService.getInstance();
        if (data.endDate <= data.startDate) {
            throw new Error('End date must be after start date');
        }
        const duration = (data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24);
        if (duration > 365) {
            throw new Error('Menu plan duration cannot exceed 365 days');
        }
        if (data.isTemplate && !data.templateCategory) {
            throw new Error('Template category is required for templates');
        }
        return await instance.create({
            schoolId: data.schoolId,
            name: data.name,
            description: data.description,
            startDate: data.startDate,
            endDate: data.endDate,
            items: [],
            isActive: data.status === MenuPlanStatus.PUBLISHED,
        });
    }
    static async updateMenuPlan(id, data) {
        const instance = MenuPlanService.getInstance();
        if (data.startDate && data.endDate && data.endDate <= data.startDate) {
            throw new Error('End date must be after start date');
        }
        return await instance.update(id, data);
    }
    static async applyTemplate(data) {
        const instance = MenuPlanService.getInstance();
        const template = await instance.findById(data.templateId);
        if (!template) {
            throw new Error('Template not found');
        }
        return await instance.create({
            schoolId: data.schoolId,
            name: data.name,
            description: template.description,
            startDate: data.startDate,
            endDate: data.endDate,
            items: template.items || [],
            isActive: false,
        });
    }
    static async updateStatus(id, status, approvedBy) {
        const validStatuses = Object.values(MenuPlanStatus);
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status value');
        }
        return {
            id,
            status,
            approvedBy,
            approvedAt: new Date(),
        };
    }
    static async getStatistics(_schoolId) {
        return {
            total: 0,
            active: 0,
            templates: 0,
            pendingApproval: 0,
            byStatus: {},
        };
    }
}
exports.MenuPlanService = MenuPlanService;
exports.menuPlanService = MenuPlanService.getInstance();
exports.default = MenuPlanService;
//# sourceMappingURL=menuPlan.service.js.map