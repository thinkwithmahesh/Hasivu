"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControlManager = void 0;
const logger_1 = require("../../../../utils/logger");
class AccessControlManager {
    policies = new Map();
    roles = new Map();
    userPermissions = new Map();
    activeSessions = new Map();
    auditLog = [];
    config;
    constructor(config = {}) {
        this.config = {
            sessionTimeout: 3600,
            auditRetention: 90,
            defaultRole: 'viewer',
            enableAudit: true,
            ...config
        };
        this.initializeDefaultRoles();
        this.initializeDefaultPolicies();
        logger_1.logger.info('AccessControlManager initialized', {
            sessionTimeout: this.config.sessionTimeout,
            enableAudit: this.config.enableAudit
        });
    }
    async initialize() {
        try {
            logger_1.logger.info('Initializing Access Control Manager');
            this.auditLog = [];
            this.activeSessions = new Map();
            this.startSessionCleanup();
            logger_1.logger.info('Access Control Manager initialized successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to initialize Access Control Manager', { error });
            throw new Error(`Access Control Manager initialization failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    startSessionCleanup() {
        setInterval(() => {
            const now = Date.now();
            const expiredSessions = [];
            this.activeSessions.forEach((session, sessionId) => {
                const sessionAge = now - session.createdAt.getTime();
                if (sessionAge > this.config.sessionTimeout * 1000) {
                    expiredSessions.push(sessionId);
                }
            });
            expiredSessions.forEach(sessionId => {
                this.activeSessions.delete(sessionId);
                logger_1.logger.debug('Session expired and cleaned up', { sessionId });
            });
        }, 60000);
    }
    async authenticateUser(userId, credentials, context) {
        const startTime = Date.now();
        try {
            logger_1.logger.info('Authenticating user', { userId });
            const isValid = await this.validateCredentials(userId, credentials);
            if (!isValid) {
                this.logAuditEvent({
                    userId,
                    action: 'authentication',
                    resource: 'system',
                    result: 'denied',
                    reason: 'Invalid credentials',
                    timestamp: new Date(),
                    ipAddress: context?.ipAddress,
                    userAgent: context?.userAgent
                });
                throw new Error('Authentication failed');
            }
            const roles = await this.getUserRoles(userId);
            const permissions = await this.getUserPermissions(userId);
            const sessionId = this.generateSessionId();
            const session = {
                sessionId,
                userId,
                roles,
                permissions,
                createdAt: new Date(),
                lastActivity: new Date(),
                ipAddress: context?.ipAddress,
                userAgent: context?.userAgent
            };
            this.activeSessions.set(sessionId, session);
            this.logAuditEvent({
                userId,
                action: 'authentication',
                resource: 'system',
                result: 'granted',
                reason: 'Valid credentials',
                timestamp: new Date(),
                sessionId,
                ipAddress: context?.ipAddress,
                userAgent: context?.userAgent
            });
            const executionTime = Date.now() - startTime;
            logger_1.logger.info('User authenticated successfully', {
                userId,
                sessionId,
                roleCount: roles.length,
                executionTime
            });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Authentication failed', { userId, error });
            throw new Error(`Authentication failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async checkAccess(sessionId, request) {
        const startTime = Date.now();
        try {
            logger_1.logger.debug('Checking access', {
                sessionId,
                userId: request.userId,
                resource: request.resource,
                action: request.action
            });
            const session = await this.validateSession(sessionId);
            if (!session) {
                return {
                    granted: false,
                    reason: 'Invalid or expired session'
                };
            }
            session.lastActivity = new Date();
            const decision = await this.evaluateAccess(session, request);
            this.logAuditEvent({
                userId: request.userId,
                action: request.action,
                resource: request.resource,
                result: decision.granted ? 'granted' : 'denied',
                reason: decision.reason,
                timestamp: request.timestamp,
                sessionId,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent
            });
            const executionTime = Date.now() - startTime;
            logger_1.logger.debug('Access check completed', {
                sessionId,
                granted: decision.granted,
                reason: decision.reason,
                executionTime
            });
            return decision;
        }
        catch (error) {
            logger_1.logger.error('Access check failed', { sessionId, request, error });
            return {
                granted: false,
                reason: `Access check error: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`
            };
        }
    }
    async validateAccess(userId, resource, action, context) {
        try {
            logger_1.logger.debug('Validating access', { userId, resource, action, context });
            const request = {
                userId,
                resource,
                action: action,
                context,
                timestamp: new Date()
            };
            const sessions = Array.from(this.activeSessions.values());
            const userSession = sessions.find(session => session.userId === userId);
            if (!userSession) {
                logger_1.logger.warn('No active session found for user', { userId });
                return false;
            }
            const decision = await this.checkAccess(userSession.sessionId, request);
            logger_1.logger.debug('Access validation result', {
                userId,
                resource,
                action,
                granted: decision.granted,
                reason: decision.reason
            });
            return decision.granted;
        }
        catch (error) {
            logger_1.logger.error('Access validation failed', { userId, resource, action, error });
            return false;
        }
    }
    async createRole(role) {
        try {
            logger_1.logger.info('Creating role', { roleId: role.id, name: role.name });
            if (this.roles.has(role.id)) {
                throw new Error(`Role already exists: ${role.id}`);
            }
            this.roles.set(role.id, {
                ...role,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            logger_1.logger.info('Role created successfully', { roleId: role.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to create role', { roleId: role.id, error });
            throw new Error(`Role creation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async updateRole(roleId, updates) {
        try {
            logger_1.logger.info('Updating role', { roleId });
            const role = this.roles.get(roleId);
            if (!role) {
                throw new Error(`Role not found: ${roleId}`);
            }
            const updatedRole = {
                ...role,
                ...updates,
                updatedAt: new Date()
            };
            this.roles.set(roleId, updatedRole);
            logger_1.logger.info('Role updated successfully', { roleId });
        }
        catch (error) {
            logger_1.logger.error('Failed to update role', { roleId, error });
            throw new Error(`Role update failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async deleteRole(roleId) {
        try {
            logger_1.logger.info('Deleting role', { roleId });
            if (!this.roles.has(roleId)) {
                throw new Error(`Role not found: ${roleId}`);
            }
            this.roles.delete(roleId);
            for (const [userId, permissions] of Array.from(this.userPermissions)) {
                const filteredPermissions = permissions.filter(p => p.role !== roleId);
                this.userPermissions.set(userId, filteredPermissions);
            }
            logger_1.logger.info('Role deleted successfully', { roleId });
        }
        catch (error) {
            logger_1.logger.error('Failed to delete role', { roleId, error });
            throw new Error(`Role deletion failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async assignRole(userId, roleId, resource) {
        try {
            logger_1.logger.info('Assigning role', { userId, roleId, resource });
            const role = this.roles.get(roleId);
            if (!role) {
                throw new Error(`Role not found: ${roleId}`);
            }
            const permissions = this.userPermissions.get(userId) || [];
            const permission = {
                userId,
                role: roleId,
                resource: resource || '*',
                grantedAt: new Date(),
                grantedBy: 'system'
            };
            permissions.push(permission);
            this.userPermissions.set(userId, permissions);
            logger_1.logger.info('Role assigned successfully', { userId, roleId });
        }
        catch (error) {
            logger_1.logger.error('Failed to assign role', { userId, roleId, error });
            throw new Error(`Role assignment failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async revokeRole(userId, roleId, resource) {
        try {
            logger_1.logger.info('Revoking role', { userId, roleId, resource });
            const permissions = this.userPermissions.get(userId) || [];
            const filteredPermissions = permissions.filter(p => !(p.role === roleId && (resource ? p.resource === resource : true)));
            this.userPermissions.set(userId, filteredPermissions);
            logger_1.logger.info('Role revoked successfully', { userId, roleId });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke role', { userId, roleId, error });
            throw new Error(`Role revocation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async createPolicy(policy) {
        try {
            logger_1.logger.info('Creating access policy', { policyId: policy.id, name: policy.name });
            if (this.policies.has(policy.id)) {
                throw new Error(`Policy already exists: ${policy.id}`);
            }
            this.policies.set(policy.id, {
                ...policy,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            logger_1.logger.info('Access policy created successfully', { policyId: policy.id });
        }
        catch (error) {
            logger_1.logger.error('Failed to create policy', { policyId: policy.id, error });
            throw new Error(`Policy creation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async getAuditLog(filters) {
        try {
            let filteredLog = [...this.auditLog];
            if (filters) {
                if (filters.userId) {
                    filteredLog = filteredLog.filter(log => log.userId === filters.userId);
                }
                if (filters.resource) {
                    filteredLog = filteredLog.filter(log => log.resource === filters.resource);
                }
                if (filters.action) {
                    filteredLog = filteredLog.filter(log => log.action === filters.action);
                }
                if (filters.startDate) {
                    filteredLog = filteredLog.filter(log => log.timestamp >= filters.startDate);
                }
                if (filters.endDate) {
                    filteredLog = filteredLog.filter(log => log.timestamp <= filters.endDate);
                }
            }
            return filteredLog.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        }
        catch (error) {
            logger_1.logger.error('Failed to get audit log', { filters, error });
            throw new Error(`Audit log retrieval failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async revokeSession(sessionId) {
        try {
            logger_1.logger.info('Revoking session', { sessionId });
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error(`Session not found: ${sessionId}`);
            }
            this.activeSessions.delete(sessionId);
            this.logAuditEvent({
                userId: session.userId,
                action: 'logout',
                resource: 'system',
                result: 'granted',
                reason: 'Session revoked',
                timestamp: new Date(),
                sessionId
            });
            logger_1.logger.info('Session revoked successfully', { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke session', { sessionId, error });
            throw new Error(`Session revocation failed: ${(error instanceof Error ? error instanceof Error ? error.message : String(error) : String(error))}`);
        }
    }
    async validateCredentials(userId, credentials) {
        return credentials && credentials.password === 'valid_password';
    }
    async getUserRoles(userId) {
        const permissions = this.userPermissions.get(userId) || [];
        return Array.from(new Set(permissions.map(p => p.role)));
    }
    async getUserPermissions(userId) {
        return this.userPermissions.get(userId) || [];
    }
    async validateSession(sessionId) {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
            return null;
        }
        const now = new Date();
        const timeoutThreshold = new Date(session.lastActivity.getTime() + this.config.sessionTimeout * 1000);
        if (now > timeoutThreshold) {
            this.activeSessions.delete(sessionId);
            return null;
        }
        return session;
    }
    async evaluateAccess(session, request) {
        const hasDirectPermission = await this.checkDirectPermission(session, request);
        if (hasDirectPermission) {
            return {
                granted: true,
                reason: 'Direct permission granted'
            };
        }
        const applicablePolicies = this.getApplicablePolicies(session, request);
        applicablePolicies.sort((a, b) => b.priority - a.priority);
        for (const policy of applicablePolicies) {
            const decision = await this.evaluatePolicy(policy, session, request);
            if (decision.granted !== undefined) {
                return decision;
            }
        }
        return {
            granted: false,
            reason: 'No applicable policy grants access'
        };
    }
    async checkDirectPermission(session, request) {
        for (const permission of session.permissions) {
            if (this.matchesResource(permission.resource, request.resource)) {
                const role = this.roles.get(permission.role);
                if (role && role.permissions.includes(request.action)) {
                    return true;
                }
            }
        }
        return false;
    }
    getApplicablePolicies(session, request) {
        const applicablePolicies = [];
        for (const policy of Array.from(this.policies.values())) {
            if (!policy.enabled)
                continue;
            for (const rule of policy.rules) {
                if (this.ruleApplies(rule, session, request)) {
                    applicablePolicies.push(policy);
                    break;
                }
            }
        }
        return applicablePolicies;
    }
    ruleApplies(rule, session, request) {
        const subjectMatch = rule.subjects.some(subject => {
            if (subject === request.userId)
                return true;
            if (session.roles.includes(subject))
                return true;
            return false;
        });
        if (!subjectMatch)
            return false;
        const resourceMatch = rule.resources.some(resource => this.matchesResource(resource, request.resource));
        if (!resourceMatch)
            return false;
        const actionMatch = rule.actions.includes(request.action) || rule.actions.includes('*');
        if (!actionMatch)
            return false;
        if (rule.conditions) {
            const conditionMatch = rule.conditions.every(condition => this.evaluateCondition(condition, session, request));
            if (!conditionMatch)
                return false;
        }
        return true;
    }
    async evaluatePolicy(policy, session, request) {
        for (const rule of policy.rules) {
            if (this.ruleApplies(rule, session, request)) {
                return {
                    granted: rule.effect === 'allow',
                    reason: `Policy ${policy.name}: ${rule.effect}`
                };
            }
        }
        return { granted: false, reason: 'Policy not applicable' };
    }
    matchesResource(pattern, resource) {
        if (pattern === '*')
            return true;
        if (pattern === resource)
            return true;
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(resource);
    }
    evaluateCondition(condition, session, request) {
        switch (condition.type) {
            case 'time':
                return this.evaluateTimeCondition(condition, request);
            case 'ip':
                return this.evaluateIpCondition(condition, session);
            default:
                return true;
        }
    }
    evaluateTimeCondition(condition, request) {
        const now = request.timestamp;
        switch (condition.operator) {
            case 'between': {
                const [start, end] = condition.value;
                return now >= new Date(start) && now <= new Date(end);
            }
            default:
                return true;
        }
    }
    evaluateIpCondition(condition, session) {
        if (!session.ipAddress)
            return false;
        switch (condition.operator) {
            case 'equals':
                return session.ipAddress === condition.value;
            case 'in':
                return condition.value.includes(session.ipAddress);
            default:
                return true;
        }
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    logAuditEvent(event) {
        if (!this.config.enableAudit)
            return;
        const auditEvent = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...event
        };
        this.auditLog.push(auditEvent);
        const cutoffDate = new Date(Date.now() - this.config.auditRetention * 24 * 60 * 60 * 1000);
        this.auditLog = this.auditLog.filter(log => log.timestamp >= cutoffDate);
        logger_1.logger.debug('Audit event logged', {
            eventId: auditEvent.id,
            userId: auditEvent.userId,
            action: auditEvent.action,
            result: auditEvent.result
        });
    }
    initializeDefaultRoles() {
        this.roles.set('admin', {
            id: 'admin',
            name: 'Administrator',
            description: 'Full system access',
            permissions: ['read', 'write', 'delete', 'admin'],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        this.roles.set('editor', {
            id: 'editor',
            name: 'Editor',
            description: 'Read and write access',
            permissions: ['read', 'write'],
            createdAt: new Date(),
            updatedAt: new Date()
        });
        this.roles.set('viewer', {
            id: 'viewer',
            name: 'Viewer',
            description: 'Read-only access',
            permissions: ['read'],
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    initializeDefaultPolicies() {
        this.policies.set('default_authenticated', {
            id: 'default_authenticated',
            name: 'Default Authenticated Access',
            description: 'Basic access for authenticated users',
            rules: [
                {
                    id: 'allow_read',
                    effect: 'allow',
                    subjects: ['*'],
                    resources: ['public/*'],
                    actions: ['read']
                }
            ],
            priority: 1,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        this.policies.set('admin_full_access', {
            id: 'admin_full_access',
            name: 'Administrator Full Access',
            description: 'Full system access for administrators',
            rules: [
                {
                    id: 'admin_all',
                    effect: 'allow',
                    subjects: ['admin'],
                    resources: ['*'],
                    actions: ['*']
                }
            ],
            priority: 100,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Access Control Manager');
        this.activeSessions.clear();
        this.policies.clear();
        this.roles.clear();
        this.userPermissions.clear();
        logger_1.logger.info('Access Control Manager shutdown complete');
    }
}
exports.AccessControlManager = AccessControlManager;
exports.default = AccessControlManager;
//# sourceMappingURL=access-control-manager.js.map