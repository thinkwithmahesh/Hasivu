/**
 * HASIVU Platform - AWS X-Ray Distributed Tracing Setup
 * Comprehensive distributed tracing for production monitoring
 * Created by DevOps Automation Specialist
 */
import AWSXRay from 'aws-xray-sdk-core';
import AWS from 'aws-sdk';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
/**
 * Custom tracing segments for business operations
 */
export interface BusinessTraceSegment {
  name: string;
  metadata: {
    userId?: string;
    orderId?: string;
    paymentId?: string;
    schoolId?: string;
    operation: string;
    businessContext: Record<string, any>;
  annotations: {
    service: string;
    environment: string;
    version: string;
    criticality: 'low' | 'medium' | 'high' | 'critical';
/**
 * Performance tracking for critical operations
 */
export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  errorMessage?: string;
  customMetrics?: Record<string, number>;
/**
 * Distributed tracing service for HASIVU platform
 */
export class DistributedTracingService {
  private static instance: DistributedTracingService;
  private performanceMetrics: Map<string, PerformanceMetrics> = new Map();
  private isInitialized = false;
  constructor() {
    this.initializeXRayTracing();
  /**
   * Get singleton instance
   */
  public static getInstance(): DistributedTracingService {
    if (!DistributedTracingService.instance) {
      DistributedTracingService.instance = new DistributedTracingService();
    return DistributedTracingService.instance;
  /**
   * Initialize AWS X-Ray tracing with production configuration
   */
  private initializeXRayTracing(): void {
    try {
      // Configure X-Ray with production settings
      AWSXRay.config([
        AWSXRay.plugins.ECSPlugin,
        AWSXRay.plugins.EKSPlugin,
        AWSXRay.plugins.EC2Plugin
      ]);
      // Set up sampling rules for production efficiency
      AWSXRay.setDaemonAddress(process.env.XRAY_DAEMON_ADDRESS || 'localhost:2000');
      // Configure sampling rules
      const samplingRules = {
        version: 2,
        default: {
          fixed_target: 1, // Always sample at least 1 request per second
          rate: 0.1       // Sample 10% of additional requests
        rules: [
            description: 'Critical payment operations',
            service_name: 'hasivu-platform',
            http_method: 'POST',
            url_path: '/payments/*',
            fixed_target: 2,
            rate: 0.5
            description: 'Authentication operations',
            service_name: 'hasivu-platform', 
            http_method: 'POST',
            url_path: '/auth/*',
            fixed_target: 1,
            rate: 0.3
            description: 'RFID operations',
            service_name: 'hasivu-platform',
            http_method: 'POST', 
            url_path: '/rfid/*',
            fixed_target: 1,
            rate: 0.4
            description: 'Order operations',
            service_name: 'hasivu-platform',
            http_method: '*',
            url_path: '/orders/*', 
            fixed_target: 1,
            rate: 0.2
            description: 'Health checks - reduced sampling',
            service_name: 'hasivu-platform',
            http_method: 'GET',
            url_path: '/health*',
            fixed_target: 0,
            rate: 0.01
        ]
      // Apply sampling rules
      AWSXRay.middleware.setSamplingRules(samplingRules);
      // Enable automatic AWS SDK tracing
      const tracedAWS = AWSXRay.captureAWS(AWS);
      // Set service name
      AWSXRay.setContextMissingStrategy('LOG_ERROR');
      // Enable SQL and HTTP request tracing
      AWSXRay.captureHTTPsGlobal(require('https'));
      AWSXRay.captureHTTPsGlobal(require('http'));
      this.isInitialized = true;
      logger.info('AWS X-Ray distributed tracing initialized', {
        daemonAddress: process.env.XRAY_DAEMON_ADDRESS || 'localhost:2000',
        environment: config.nodeEnv,
        samplingEnabled: true
    } catch (error) {
      logger.error('Failed to initialize X-Ray tracing', { error });
  /**
   * Create a custom business operation trace
   */
  public traceBusinessOperation<T>(
    segmentData: BusinessTraceSegment,
    operation: () => Promise<T> | T
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (!this.isInitialized) {
        logger.warn('X-Ray tracing not initialized, executing operation without tracing');
        try {
          const result = await operation();
          resolve(result);
        } catch (error) {
          reject(error);
        return;
      const segment = new AWSXRay.Segment(segmentData.name);
      try {
        // Add business annotations for filtering
        Object.entries(segmentData.annotations).forEach(([key, value]) => {
          segment.addAnnotation(key, value);
        // Add business metadata for detailed analysis
        segment.addMetadata('business', segmentData.metadata);
        segment.addMetadata('timestamp', {
          start: new Date().toISOString(),
          epoch: Date.now()
        // Add performance tracking
        const performanceId = `${segmentData.name}-${Date.now()}`;
        const performanceMetrics: PerformanceMetrics = {
          operationName: segmentData.name,
          startTime: Date.now(),
          success: false
        AWSXRay.setSegment(segment);
        // Execute the operation
        const result = await operation();
        // Mark as successful
        performanceMetrics.endTime = Date.now();
        performanceMetrics.duration = performanceMetrics.endTime - performanceMetrics.startTime;
        performanceMetrics.success = true;
        segment.addMetadata('performance', {
          duration: performanceMetrics.duration,
          success: true,
          endTime: new Date().toISOString()
        // Add custom business metrics if available
        if (segmentData.metadata.businessContext) {
          this.addBusinessMetricsToSegment(segment, segmentData.metadata.businessContext);
        this.performanceMetrics.set(performanceId, performanceMetrics);
        segment.close();
        resolve(result);
        // Log performance metrics for business operations
        if (segmentData.annotations.criticality === 'critical' || performanceMetrics.duration > 5000) {
          logger.info('Critical operation performance', {
            operation: segmentData.name,
            duration: performanceMetrics.duration,
            success: true,
            userId: segmentData.metadata.userId,
            businessContext: segmentData.metadata.businessContext
      } catch (error) {
        // Record error in segment
        segment.addError(error);
        segment.addMetadata('error', {
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        performanceMetrics.endTime = Date.now();
        performanceMetrics.duration = performanceMetrics.endTime - performanceMetrics.startTime;
        performanceMetrics.success = false;
        performanceMetrics.errorMessage = error.message;
        this.performanceMetrics.set(performanceId, performanceMetrics);
        segment.close(error);
        // Log critical errors
        logger.error('Business operation failed', {
          operation: segmentData.name,
          error: error.message,
          duration: performanceMetrics.duration,
          userId: segmentData.metadata.userId,
          stack: error.stack
        reject(error);
  /**
   * Create payment operation trace
   */
  public tracePaymentOperation<T>(
    paymentId: string,
    operation: string,
    userId: string,
    amount: number,
    paymentMethod: string,
    operationFn: () => Promise<T> | T
  ): Promise<T> {
    const segmentData: BusinessTraceSegment = {
      name: `payment-${operation}`,
      metadata: {
        userId,
        paymentId,
        operation,
        businessContext: {
          amount,
          paymentMethod,
          currency: 'INR',
          timestamp: new Date().toISOString()
      annotations: {
        service: 'payment-service',
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        criticality: 'critical'
    return this.traceBusinessOperation(segmentData, operationFn);
  /**
   * Create RFID operation trace
   */
  public traceRFIDOperation<T>(
    studentId: string,
    cardId: string,
    operation: string,
    schoolId: string,
    operationFn: () => Promise<T> | T
  ): Promise<T> {
    const segmentData: BusinessTraceSegment = {
      name: `rfid-${operation}`,
      metadata: {
        userId: studentId,
        schoolId,
        operation,
        businessContext: {
          cardId,
          operationType: operation,
          timestamp: new Date().toISOString()
      annotations: {
        service: 'rfid-service',
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        criticality: 'high'
    return this.traceBusinessOperation(segmentData, operationFn);
  /**
   * Create order operation trace
   */
  public traceOrderOperation<T>(
    orderId: string,
    operation: string,
    userId: string,
    orderDetails: any,
    operationFn: () => Promise<T> | T
  ): Promise<T> {
    const segmentData: BusinessTraceSegment = {
      name: `order-${operation}`,
      metadata: {
        userId,
        orderId,
        operation,
        businessContext: {
          ...orderDetails,
          timestamp: new Date().toISOString()
      annotations: {
        service: 'order-service',
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        criticality: 'high'
    return this.traceBusinessOperation(segmentData, operationFn);
  /**
   * Create authentication operation trace
   */
  public traceAuthOperation<T>(
    operation: string,
    userId: string | undefined,
    authMethod: string,
    operationFn: () => Promise<T> | T
  ): Promise<T> {
    const segmentData: BusinessTraceSegment = {
      name: `auth-${operation}`,
      metadata: {
        userId,
        operation,
        businessContext: {
          authMethod,
          timestamp: new Date().toISOString()
      annotations: {
        service: 'auth-service',
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        criticality: 'high'
    return this.traceBusinessOperation(segmentData, operationFn);
  /**
   * Create database operation trace
   */
  public traceDatabaseOperation<T>(
    operation: string,
    tableName: string,
    operationFn: () => Promise<T> | T
  ): Promise<T> {
    const segmentData: BusinessTraceSegment = {
      name: `db-${operation}`,
      metadata: {
        operation,
        businessContext: {
          tableName,
          operationType: operation,
          timestamp: new Date().toISOString()
      annotations: {
        service: 'database-service',
        environment: config.nodeEnv,
        version: process.env.npm_package_version || '1.0.0',
        criticality: 'medium'
    return this.traceBusinessOperation(segmentData, operationFn);
  /**
   * Add business-specific metrics to X-Ray segment
   */
  private addBusinessMetricsToSegment(segment: any, businessContext: Record<string, any>): void {
    // Add business KPIs as annotations for filtering
    if (businessContext.amount) {
      segment.addAnnotation('transaction_amount', businessContext.amount);
    if (businessContext.paymentMethod) {
      segment.addAnnotation('payment_method', businessContext.paymentMethod);
    if (businessContext.orderType) {
      segment.addAnnotation('order_type', businessContext.orderType);
    if (businessContext.schoolId) {
      segment.addAnnotation('school_id', businessContext.schoolId);
    // Add revenue classification
    if (businessContext.amount) {
      let revenueCategory = 'low';
      if (businessContext.amount > 1000) revenueCategory = 'high';
      else if (businessContext.amount > 500) revenueCategory = 'medium';
      segment.addAnnotation('revenue_category', revenueCategory);
  /**
   * Get middleware for Express/Lambda integration
   */
  public getTracingMiddleware() {
    if (!this.isInitialized) {
      return (req: any, res: any, next: any) => next();
    return AWSXRay.express.openSegment('hasivu-platform');
  /**
   * Get closing middleware for Express integration
   */
  public getTracingCloseMiddleware() {
    if (!this.isInitialized) {
      return (req: any, res: any, next: any) => next();
    return AWSXRay.express.closeSegment();
  /**
   * Create subsegment for external service calls
   */
  public traceExternalService<T>(
    serviceName: string,
    operation: string,
    serviceCall: () => Promise<T> | T
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      if (!this.isInitialized) {
        try {
          const result = await serviceCall();
          resolve(result);
        } catch (error) {
          reject(error);
        return;
      const subsegment = AWSXRay.getSegment()?.addNewSubsegment(`external-${serviceName}`);
      if (!subsegment) {
        logger.warn('No active segment found for external service trace');
        try {
          const result = await serviceCall();
          resolve(result);
        } catch (error) {
          reject(error);
        return;
      try {
        subsegment.addAnnotation('service_name', serviceName);
        subsegment.addAnnotation('operation', operation);
        subsegment.addAnnotation('external_service', true);
        const startTime = Date.now();
        const result = await serviceCall();
        const duration = Date.now() - startTime;
        subsegment.addMetadata('performance', {
          duration,
          success: true,
          service: serviceName,
          operation
        subsegment.close();
        resolve(result);
      } catch (error) {
        subsegment.addError(error);
        subsegment.addMetadata('error', {
          service: serviceName,
          operation,
          error: error.message,
          timestamp: new Date().toISOString()
        subsegment.close(error);
        reject(error);
  /**
   * Get performance metrics summary
   */
  public getPerformanceMetrics(): PerformanceMetrics[] {
    return Array.from(this.performanceMetrics.values());
  /**
   * Get critical operation performance summary
   */
  public getCriticalOperationMetrics(): {
    averageDuration: number;
    successRate: number;
    totalOperations: number;
    slowOperations: number;
    const metrics = this.getPerformanceMetrics();
    const criticalOps = metrics.filter(m => 
      m.operationName.includes('payment') || 
      m.operationName.includes('order') ||
      m.operationName.includes('auth')
    if (criticalOps.length === 0) {
      return {
        averageDuration: 0,
        successRate: 0,
        totalOperations: 0,
        slowOperations: 0
    const totalDuration = criticalOps.reduce((sum, m) => sum + (m.duration || 0), 0);
    const successfulOps = criticalOps.filter(m => m.success).length;
    const slowOps = criticalOps.filter(m => (m.duration || 0) > 5000).length;
    return {
      averageDuration: totalDuration / criticalOps.length,
      successRate: (successfulOps / criticalOps.length) * 100,
      totalOperations: criticalOps.length,
      slowOperations: slowOps
  /**
   * Clear performance metrics cache
   */
  public clearMetricsCache(): void {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    for (const [key, metrics] of this.performanceMetrics) {
      if (metrics.startTime < cutoffTime) {
        this.performanceMetrics.delete(key);
  /**
   * Manual trace annotation for custom business events
   */
  public addBusinessAnnotation(key: string, value: string | number): void {
    if (!this.isInitialized) return;
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addAnnotation(key, value);
  /**
   * Manual trace metadata for detailed business context
   */
  public addBusinessMetadata(namespace: string, data: Record<string, any>): void {
    if (!this.isInitialized) return;
    const segment = AWSXRay.getSegment();
    if (segment) {
      segment.addMetadata(namespace, data);
  /**
   * Check if tracing is initialized
   */
  public isTracingEnabled(): boolean {
    return this.isInitialized;
// Export singleton instance
export const distributedTracingService = DistributedTracingService.getInstance();
/**
 * Decorator for automatic tracing of class methods
 */
export function TraceBusinessOperation(
  operationName: string,
  criticality: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const segmentData: BusinessTraceSegment = {
        name: operationName,
        metadata: {
          operation: operationName,
          businessContext: {
            className: target.constructor.name,
            methodName: propertyKey,
            timestamp: new Date().toISOString()
        annotations: {
          service: 'hasivu-platform',
          environment: config.nodeEnv,
          version: process.env.npm_package_version || '1.0.0',
          criticality
      return distributedTracingService.traceBusinessOperation(
        segmentData,
        () => originalMethod.apply(this, args)
    return descriptor;
export default distributedTracingService;