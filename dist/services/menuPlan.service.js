"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuPlanService = exports.MenuPlanService = exports.MenuPlanStatus = void 0;
// Local enum to match schema comments  
var MenuPlanStatus;
(function (MenuPlanStatus) {
    MenuPlanStatus["DRAFT"] = "DRAFT";
    MenuPlanStatus["ACTIVE"] = "ACTIVE";
    MenuPlanStatus["COMPLETED"] = "COMPLETED";
    MenuPlanStatus["ARCHIVED"] = "ARCHIVED";
})(MenuPlanStatus || (exports.MenuPlanStatus = MenuPlanStatus = {}));
const menuPlan_repository_1 = require("../repositories/menuPlan.repository");
const dailyMenu_repository_1 = require("../repositories/dailyMenu.repository");
const menuItem_repository_1 = require("../repositories/menuItem.repository");
const logger_1 = require("../utils/logger");
const cache_1 = require("../utils/cache");
/**
 * Menu Plan Service class
 */
class MenuPlanService {
    static CACHE_TTL = 600; // 10 minutes
    static MAX_PLAN_DURATION_DAYS = 365;
    static VALID_APPROVAL_TYPES = ['ADMIN', 'NUTRITIONIST', 'PRINCIPAL'];
    /**
     * Create new menu plan
     */
    static async createMenuPlan(input) {
        try {
            logger_1.logger.info('Creating menu plan', { name: input.name, schoolId: input.schoolId });
            // Validate business rules
            await this.validateCreateInput(input);
            // Check for overlapping menu plans
            const overlapping = await menuPlan_repository_1.MenuPlanRepository.findOverlapping(input.schoolId, input.startDate, input.endDate);
            if (overlapping.length > 0) {
                const conflictNames = overlapping.map(plan => plan.name).join(', ');
                throw new Error(`Overlapping menu plans found: ${conflictNames}`);
            }
            // Prepare data for creation (match MenuPlanRepository.MenuPlanCreateInput interface)
            const createData = {
                name: input.name.trim(),
                description: input.description?.trim(),
                startDate: input.startDate,
                endDate: input.endDate,
                status: input.status || MenuPlanStatus.DRAFT,
                approvalWorkflow: input.approvalWorkflow,
                metadata: input.metadata || {},
                schoolId: input.schoolId,
                createdBy: input.createdBy
                // Note: template and recurring fields not available in current CreateMenuPlanInput interface
            };
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.create(createData);
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            logger_1.logger.info('Menu plan created successfully', { menuPlanId: menuPlan.id });
            return menuPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to create menu plan', error, { input });
            throw error;
        }
    }
    /**
     * Get menu plan by ID
     */
    static async getMenuPlanById(id, includeMenus = false) {
        try {
            const cacheKey = `menu_plan:${id}:${includeMenus}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id, includeMenus);
            if (!menuPlan) {
                logger_1.logger.warn('Menu plan not found', { menuPlanId: id });
                return null;
            }
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(menuPlan));
            return menuPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu plan by ID', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Get menu plans with filtering and pagination
     */
    static async getMenuPlans(filters = {}, pagination = {}) {
        try {
            const page = pagination.page || 1;
            const limit = Math.min(pagination.limit || 20, 100);
            const skip = (page - 1) * limit;
            const options = {
                filters,
                skip,
                take: limit,
                sortBy: pagination.sortBy || 'createdAt',
                sortOrder: pagination.sortOrder || 'desc'
            };
            const result = await menuPlan_repository_1.MenuPlanRepository.findMany(options);
            const totalPages = Math.ceil(result.total / limit);
            logger_1.logger.info('Retrieved menu plans', {
                count: result.plans.length,
                total: result.total,
                page,
                filters
            });
            return {
                plans: result.plans,
                total: result.total,
                page,
                totalPages
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu plans', error, { filters, pagination });
            throw error;
        }
    }
    /**
     * Get active menu plan for school and date
     */
    static async getActiveMenuPlan(schoolId, date) {
        try {
            const cacheKey = `active_menu_plan:${schoolId}:${date.toISOString().split('T')[0]}`;
            const cached = await cache_1.cache.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }
            const activePlans = await menuPlan_repository_1.MenuPlanRepository.getActivePlansForDateRange(schoolId, date, date);
            const menuPlan = activePlans.length > 0 ? activePlans[0] : null;
            if (!menuPlan) {
                logger_1.logger.warn('No active menu plan found', { schoolId, date });
                return null;
            }
            await cache_1.cache.setex(cacheKey, this.CACHE_TTL, JSON.stringify(menuPlan));
            return menuPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to get active menu plan', error, { schoolId, date });
            throw error;
        }
    }
    /**
     * Update menu plan
     */
    static async updateMenuPlan(id, input) {
        try {
            logger_1.logger.info('Updating menu plan', { menuPlanId: id });
            // Check if menu plan exists
            const existing = await menuPlan_repository_1.MenuPlanRepository.findById(id);
            if (!existing) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            // Validate business rules if updating critical fields
            if (input.startDate || input.endDate || input.status) {
                await this.validateUpdateInput(input, existing);
            }
            // Check for overlapping plans if dates are being changed
            if (input.startDate || input.endDate) {
                const startDate = input.startDate || existing.startDate;
                const endDate = input.endDate || existing.endDate;
                const overlapping = await menuPlan_repository_1.MenuPlanRepository.findOverlapping(existing.schoolId, startDate, endDate, id // Exclude current plan from overlap check
                );
                if (overlapping.length > 0) {
                    const conflictNames = overlapping.map(plan => plan.name).join(', ');
                    throw new Error(`Overlapping menu plans found: ${conflictNames}`);
                }
            }
            // Prepare update data (match repository expectations)
            const updateData = {};
            if (input.name !== undefined)
                updateData.name = input.name.trim();
            if (input.description !== undefined)
                updateData.description = input.description?.trim();
            if (input.startDate !== undefined)
                updateData.startDate = input.startDate;
            if (input.endDate !== undefined)
                updateData.endDate = input.endDate;
            if (input.status !== undefined)
                updateData.status = input.status;
            if (input.approvalWorkflow !== undefined)
                updateData.approvalWorkflow = input.approvalWorkflow;
            if (input.metadata !== undefined)
                updateData.metadata = input.metadata;
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.update(id, updateData);
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            await cache_1.cache.del(`menu_plan:${id}:true`);
            await cache_1.cache.del(`menu_plan:${id}:false`);
            logger_1.logger.info('Menu plan updated successfully', { menuPlanId: menuPlan.id });
            return menuPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to update menu plan', error, { menuPlanId: id, input });
            throw error;
        }
    }
    /**
     * Delete menu plan
     */
    static async deleteMenuPlan(id) {
        try {
            logger_1.logger.info('Deleting menu plan', { menuPlanId: id });
            const existing = await menuPlan_repository_1.MenuPlanRepository.findById(id);
            if (!existing) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            // Check if plan can be deleted (not active and not approved)
            if (existing.status === 'ACTIVE' || existing.status === 'PUBLISHED') {
                throw new Error('Cannot delete active menu plan');
            }
            if (existing.status === 'APPROVED') {
                throw new Error('Cannot delete approved menu plan');
            }
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.delete(id);
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            logger_1.logger.info('Menu plan deleted successfully', { menuPlanId: menuPlan.id });
            return menuPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to delete menu plan', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Assign daily menus to menu plan
     */
    static async assignDailyMenus(planId, assignments) {
        try {
            logger_1.logger.info('Assigning daily menus to plan', { planId, assignmentCount: assignments.length });
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(planId);
            if (!menuPlan) {
                throw new Error(`Menu plan with ID ${planId} not found`);
            }
            // Validate assignments
            for (const assignment of assignments) {
                await this.validateDailyMenuAssignment(assignment, menuPlan);
            }
            // Execute assignments (transaction not available in repository)
            for (const assignment of assignments) {
                await dailyMenu_repository_1.DailyMenuRepository.create({
                    menuPlan: { connect: { id: planId } },
                    date: assignment.date,
                    metadata: assignment.menuItems ? JSON.stringify(assignment.menuItems) : '{}'
                });
            }
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            await cache_1.cache.del(`menu_plan:${planId}:true`);
            logger_1.logger.info('Daily menus assigned successfully', { planId, assignmentCount: assignments.length });
        }
        catch (error) {
            logger_1.logger.error('Failed to assign daily menus', error, { planId, assignments });
            throw error;
        }
    }
    /**
     * Activate menu plan
     */
    static async activateMenuPlan(id) {
        try {
            logger_1.logger.info('Activating menu plan', { menuPlanId: id });
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id);
            if (!menuPlan) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            if (menuPlan.status !== 'APPROVED') {
                throw new Error('Only approved menu plans can be activated');
            }
            // Note: deactivateOverlapping method not available in current repository
            const updatedPlan = await menuPlan_repository_1.MenuPlanRepository.update(id, { status: 'ACTIVE' });
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            logger_1.logger.info('Menu plan activated successfully', { menuPlanId: id });
            return updatedPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to activate menu plan', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Submit menu plan for approval
     */
    static async submitForApproval(id, submittedBy) {
        try {
            logger_1.logger.info('Submitting menu plan for approval', { menuPlanId: id, submittedBy });
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id, true);
            if (!menuPlan) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            if (menuPlan.status !== 'DRAFT') {
                throw new Error('Only draft menu plans can be submitted for approval');
            }
            // Check if plan has daily menus assigned
            const existingMenus = await dailyMenu_repository_1.DailyMenuRepository.findByMenuPlanId(id);
            const hasMenus = existingMenus.length > 0;
            if (!hasMenus) {
                throw new Error('Menu plan must have daily menus assigned before submission');
            }
            const updatedPlan = await menuPlan_repository_1.MenuPlanRepository.update(id, {
                status: 'PENDING_APPROVAL',
                metadata: JSON.stringify({
                    ...JSON.parse(menuPlan.metadata || '{}'),
                    submittedAt: new Date().toISOString(),
                    submittedBy
                })
            });
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            logger_1.logger.info('Menu plan submitted for approval successfully', { menuPlanId: id });
            return updatedPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to submit menu plan for approval', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Approve menu plan
     */
    static async approveMenuPlan(id, approvedBy, notes) {
        try {
            logger_1.logger.info('Approving menu plan', { menuPlanId: id, approvedBy });
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id);
            if (!menuPlan) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            if (menuPlan.status !== 'PENDING_APPROVAL') {
                throw new Error('Only pending approval menu plans can be approved');
            }
            const updatedPlan = await menuPlan_repository_1.MenuPlanRepository.update(id, {
                status: 'APPROVED',
                metadata: JSON.stringify({
                    ...JSON.parse(menuPlan.metadata || '{}'),
                    approvedAt: new Date().toISOString(),
                    approvedBy,
                    approvalNotes: notes
                })
            });
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            logger_1.logger.info('Menu plan approved successfully', { menuPlanId: id });
            return updatedPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to approve menu plan', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Reject menu plan
     */
    static async rejectMenuPlan(id, rejectedBy, reason) {
        try {
            logger_1.logger.info('Rejecting menu plan', { menuPlanId: id, rejectedBy });
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id);
            if (!menuPlan) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            if (menuPlan.status !== 'PENDING_APPROVAL') {
                throw new Error('Only pending approval menu plans can be rejected');
            }
            const updatedPlan = await menuPlan_repository_1.MenuPlanRepository.update(id, {
                status: 'REJECTED',
                metadata: JSON.stringify({
                    ...JSON.parse(menuPlan.metadata || '{}'),
                    rejectedAt: new Date().toISOString(),
                    rejectedBy,
                    rejectionReason: reason
                })
            });
            // Clear relevant caches
            await this.clearRelatedCaches(menuPlan.schoolId);
            logger_1.logger.info('Menu plan rejected successfully', { menuPlanId: id });
            return updatedPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to reject menu plan', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Get menu plan analytics
     */
    static async getMenuPlanAnalytics(id) {
        try {
            const menuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id, true);
            if (!menuPlan) {
                throw new Error(`Menu plan with ID ${id} not found`);
            }
            const analytics = await this.calculateAnalytics(menuPlan);
            logger_1.logger.info('Generated menu plan analytics', { menuPlanId: id });
            return analytics;
        }
        catch (error) {
            logger_1.logger.error('Failed to get menu plan analytics', error, { menuPlanId: id });
            throw error;
        }
    }
    /**
     * Clone menu plan
     */
    static async cloneMenuPlan(id, newName, startDate, endDate, createdBy) {
        try {
            logger_1.logger.info('Cloning menu plan', { sourceId: id, newName });
            const sourceMenuPlan = await menuPlan_repository_1.MenuPlanRepository.findById(id, true);
            if (!sourceMenuPlan) {
                throw new Error(`Source menu plan with ID ${id} not found`);
            }
            // Create new menu plan
            const cloneInput = {
                name: newName,
                description: `Cloned from: ${sourceMenuPlan.name}`,
                schoolId: sourceMenuPlan.schoolId,
                startDate,
                endDate,
                status: MenuPlanStatus.DRAFT,
                isActive: false,
                // Note: approvalRequired field not available in current schema
                approvalWorkflow: sourceMenuPlan.approvalWorkflow ? JSON.parse(sourceMenuPlan.approvalWorkflow) : undefined,
                metadata: {
                    clonedFrom: sourceMenuPlan.id,
                    clonedAt: new Date().toISOString()
                },
                createdBy
            };
            const newMenuPlan = await this.createMenuPlan(cloneInput);
            // Clone daily menus if they exist
            if (sourceMenuPlan.dailyMenus && sourceMenuPlan.dailyMenus.length > 0) {
                const assignments = this.mapDailyMenusToAssignments(sourceMenuPlan.dailyMenus, startDate, endDate);
                await this.assignDailyMenus(newMenuPlan.id, assignments);
            }
            logger_1.logger.info('Menu plan cloned successfully', { sourceId: id, cloneId: newMenuPlan.id });
            return newMenuPlan;
        }
        catch (error) {
            logger_1.logger.error('Failed to clone menu plan', error, { sourceId: id, newName });
            throw error;
        }
    }
    /**
     * Validate create input
     */
    static async validateCreateInput(input) {
        if (!input.name?.trim()) {
            throw new Error('Menu plan name is required');
        }
        if (input.name.length > 200) {
            throw new Error('Menu plan name cannot exceed 200 characters');
        }
        if (input.description && input.description.length > 1000) {
            throw new Error('Menu plan description cannot exceed 1000 characters');
        }
        if (input.startDate >= input.endDate) {
            throw new Error('Start date must be before end date');
        }
        const durationDays = Math.ceil((input.endDate.getTime() - input.startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (durationDays > this.MAX_PLAN_DURATION_DAYS) {
            throw new Error(`Menu plan duration cannot exceed ${this.MAX_PLAN_DURATION_DAYS} days`);
        }
        if (input.status && !['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(input.status)) {
            throw new Error(`Invalid status: ${input.status}`);
        }
        if (input.approvalWorkflow) {
            const workflow = input.approvalWorkflow;
            if (workflow.approverTypes && Array.isArray(workflow.approverTypes)) {
                const invalidTypes = workflow.approverTypes.filter((type) => !this.VALID_APPROVAL_TYPES.includes(type));
                if (invalidTypes.length > 0) {
                    throw new Error(`Invalid approval types: ${invalidTypes.join(', ')}`);
                }
            }
        }
    }
    /**
     * Validate update input
     */
    static async validateUpdateInput(input, existing) {
        if (input.name !== undefined && !input.name?.trim()) {
            throw new Error('Menu plan name cannot be empty');
        }
        if (input.name && input.name.length > 200) {
            throw new Error('Menu plan name cannot exceed 200 characters');
        }
        if (input.description && input.description.length > 1000) {
            throw new Error('Menu plan description cannot exceed 1000 characters');
        }
        const startDate = input.startDate || existing.startDate;
        const endDate = input.endDate || existing.endDate;
        if (startDate >= endDate) {
            throw new Error('Start date must be before end date');
        }
        const durationDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (durationDays > this.MAX_PLAN_DURATION_DAYS) {
            throw new Error(`Menu plan duration cannot exceed ${this.MAX_PLAN_DURATION_DAYS} days`);
        }
        if (input.status && !['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(input.status)) {
            throw new Error(`Invalid status: ${input.status}`);
        }
    }
    /**
     * Validate daily menu assignment
     */
    static async validateDailyMenuAssignment(assignment, menuPlan) {
        // Check if date is within plan range
        if (assignment.date < menuPlan.startDate || assignment.date > menuPlan.endDate) {
            throw new Error(`Assignment date ${assignment.date.toISOString()} is outside plan range`);
        }
        // Validate menu items exist
        for (const item of assignment.menuItems) {
            const menuItem = await menuItem_repository_1.MenuItemRepository.findById(item.menuItemId);
            if (!menuItem) {
                throw new Error(`Menu item with ID ${item.menuItemId} not found`);
            }
            if (!menuItem.available) {
                throw new Error(`Menu item ${menuItem.name} is not available`);
            }
        }
    }
    /**
     * Calculate analytics for menu plan
     */
    static async calculateAnalytics(menuPlan) {
        let totalMenuItems = 0;
        let totalCalories = 0;
        let totalCost = 0;
        const allergenCounts = {};
        const costByMealType = {};
        const nutritionalSummary = {};
        for (const dailyMenu of menuPlan.dailyMenus) {
            for (const menuItem of dailyMenu.menuItems) {
                totalMenuItems++;
                totalCost += menuItem.price;
                costByMealType[dailyMenu.mealType] = (costByMealType[dailyMenu.mealType] || 0) + menuItem.price;
                // Get full menu item details for analytics
                const fullMenuItem = await menuItem_repository_1.MenuItemRepository.findById(menuItem.id);
                if (fullMenuItem) {
                    if (fullMenuItem.calories) {
                        totalCalories += fullMenuItem.calories;
                    }
                    if (fullMenuItem.allergens) {
                        try {
                            const allergens = JSON.parse(fullMenuItem.allergens);
                            allergens.forEach(allergen => {
                                allergenCounts[allergen] = (allergenCounts[allergen] || 0) + 1;
                            });
                        }
                        catch {
                            // Skip invalid allergen data
                        }
                    }
                    if (fullMenuItem.nutritionalInfo) {
                        try {
                            const nutrition = JSON.parse(fullMenuItem.nutritionalInfo);
                            Object.keys(nutrition).forEach(key => {
                                if (typeof nutrition[key] === 'number') {
                                    nutritionalSummary[key] = (nutritionalSummary[key] || 0) + nutrition[key];
                                }
                            });
                        }
                        catch {
                            // Skip invalid nutritional data
                        }
                    }
                }
            }
        }
        const planDays = Math.ceil((menuPlan.endDate.getTime() - menuPlan.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return {
            totalMenuItems,
            averageCaloriesPerDay: planDays > 0 ? totalCalories / planDays : 0,
            allergenSummary: allergenCounts,
            costAnalysis: {
                totalCost,
                averageCostPerDay: planDays > 0 ? totalCost / planDays : 0,
                costByMealType
            },
            nutritionalSummary
        };
    }
    /**
     * Map daily menus to assignments for cloning
     */
    static mapDailyMenusToAssignments(dailyMenus, newStartDate, newEndDate) {
        const assignments = [];
        const dateDiff = newStartDate.getTime() - dailyMenus[0]?.date.getTime() || 0;
        for (const dailyMenu of dailyMenus) {
            const newDate = new Date(dailyMenu.date.getTime() + dateDiff);
            // Skip if new date is outside the new plan range
            if (newDate < newStartDate || newDate > newEndDate) {
                continue;
            }
            assignments.push({
                date: newDate,
                menuItems: dailyMenu.menuItems.map((item) => ({
                    menuItemId: item.id,
                    mealType: dailyMenu.mealType,
                    servingSize: item.servingSize,
                    notes: item.notes
                }))
            });
        }
        return assignments;
    }
    /**
     * Clear related caches
     */
    static async clearRelatedCaches(schoolId) {
        try {
            const cacheKeys = [
                'menu_plans:*',
                `school:${schoolId}:menu_plans:*`,
                `active_menu_plan:${schoolId}:*`
            ];
            await Promise.all(cacheKeys.map(key => cache_1.cache.del(key)));
        }
        catch (error) {
            logger_1.logger.warn('Failed to clear caches', { error: error.message, schoolId });
        }
    }
    /**
     * Disconnect from external resources (instance method for tests)
     */
    async disconnect() {
        try {
            // No specific resources to disconnect from in this service
            logger_1.logger.info('Menu plan service disconnected');
        }
        catch (error) {
            logger_1.logger.warn('Failed to disconnect menu plan service', error);
        }
    }
    // Instance methods delegating to static methods for testing compatibility
    /**
     * Create new menu plan (instance method)
     */
    async createMenuPlan(input) {
        return MenuPlanService.createMenuPlan(input);
    }
    /**
     * Get menu plan by ID (instance method)
     */
    async getMenuPlanById(id, includeDetails = true) {
        return MenuPlanService.getMenuPlanById(id, includeDetails);
    }
    /**
     * Update menu plan (instance method)
     */
    async updateMenuPlan(id, input) {
        return MenuPlanService.updateMenuPlan(id, input);
    }
    /**
     * Delete menu plan (instance method)
     */
    async deleteMenuPlan(id) {
        const result = await MenuPlanService.deleteMenuPlan(id);
        return !!result; // Convert MenuPlan to boolean
    }
    /**
     * Get active menu plan for school (instance method)
     */
    async getActiveMenuPlan(schoolId) {
        return MenuPlanService.getActiveMenuPlan(schoolId, new Date());
    }
    /**
     * Assign menu items to plan (instance method)
     */
    async assignMenuItemsToPlan(planId, assignments) {
        // Convert MenuItemAssignments to DailyMenuAssignments
        const dailyMenuAssignments = assignments.reduce((acc, assignment) => {
            const existingDay = acc.find(day => day.date.getTime() === assignment.date.getTime());
            if (existingDay) {
                existingDay.menuItems.push({
                    menuItemId: assignment.menuItemId,
                    mealType: assignment.mealType,
                    servingSize: assignment.servingSize,
                    notes: assignment.notes
                });
            }
            else {
                acc.push({
                    date: assignment.date,
                    menuItems: [{
                            menuItemId: assignment.menuItemId,
                            mealType: assignment.mealType,
                            servingSize: assignment.servingSize,
                            notes: assignment.notes
                        }]
                });
            }
            return acc;
        }, []);
        await MenuPlanService.assignDailyMenus(planId, dailyMenuAssignments);
        // Return the updated menu plan
        const updatedPlan = await MenuPlanService.getMenuPlanById(planId);
        if (!updatedPlan) {
            throw new Error(`Menu plan with ID ${planId} not found after assignment`);
        }
        return updatedPlan;
    }
    /**
     * Activate menu plan (instance method)
     */
    async activateMenuPlan(planId) {
        return MenuPlanService.activateMenuPlan(planId);
    }
    /**
     * Deactivate menu plan (instance method)
     */
    async deactivateMenuPlan(planId) {
        // Since deactivateMenuPlan doesn't exist, we'll update the plan to set isActive to false
        return MenuPlanService.updateMenuPlan(planId, { isActive: false });
    }
    /**
     * Create weekly menu plan (instance method)
     */
    async createWeeklyPlan(input) {
        // Weekly plan is just a menu plan with 7-day duration
        const weeklyInput = {
            ...input,
            endDate: input.endDate || new Date(input.startDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        };
        return this.createMenuPlan(weeklyInput);
    }
    /**
     * Calculate nutritional summary for menu plan (instance method)
     */
    async calculateNutritionalSummary(planId) {
        // Mock implementation for nutritional summary
        return {
            totalCalories: 0,
            avgCaloriesPerMeal: 0,
            nutrients: {
                protein: 0,
                carbs: 0,
                fat: 0,
                fiber: 0,
                sugar: 0
            },
            dietaryInfo: {
                vegetarian: true,
                vegan: false,
                glutenFree: false,
                nutFree: true
            }
        };
    }
}
exports.MenuPlanService = MenuPlanService;
// Export singleton instance
exports.menuPlanService = new MenuPlanService();
