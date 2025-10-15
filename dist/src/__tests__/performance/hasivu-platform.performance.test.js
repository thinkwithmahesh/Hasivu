"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const perf_hooks_1 = require("perf_hooks");
const nutritional_compliance_service_1 = require("../../services/nutritional-compliance.service");
const redis_cache_service_1 = require("../../lib/cache/redis-cache.service");
const production_monitoring_service_1 = require("../../lib/monitoring/production-monitoring.service");
const PERFORMANCE_THRESHOLDS = {
    api: {
        maxResponseTime: 100,
        maxP95ResponseTime: 200,
        maxMemoryUsage: 100,
    },
    database: {
        maxQueryTime: 50,
        maxConnectionTime: 100,
    },
    cache: {
        maxSetTime: 5,
        maxGetTime: 2,
        maxHitRate: 95,
    },
    concurrency: {
        maxConcurrentUsers: 1000,
        maxThroughput: 500,
    },
};
describe('HASIVU Platform - Performance Tests', () => {
    let nutritionalService;
    let cacheService;
    let monitoringService;
    beforeAll(async () => {
        nutritionalService = new nutritional_compliance_service_1.NutritionalComplianceService();
        cacheService = new redis_cache_service_1.RedisCacheService(process.env.TEST_REDIS_URL || 'redis://localhost:6379/15');
        monitoringService = new production_monitoring_service_1.ProductionMonitoringService();
        await cacheService.connect();
    });
    afterAll(async () => {
        await cacheService.disconnect();
    });
    describe('API Response Time Performance', () => {
        it('should handle menu retrieval under performance threshold', async () => {
            const menuItems = Array.from({ length: 100 }, (_, i) => ({
                id: `perf_item_${i}`,
                name: `Performance Test Item ${i}`,
                price: 50 + (i % 50),
                nutritionalInfo: {
                    calories: 200 + (i % 300),
                    protein: 10 + (i % 15),
                    fat: 5 + (i % 20),
                    carbohydrates: 30 + (i % 40),
                },
                allergens: i % 3 === 0 ? ['GLUTEN'] : [],
                available: true,
            }));
            const startTime = perf_hooks_1.performance.now();
            const promises = menuItems.map(async (item) => {
                await cacheService.cacheMenuItem(item);
                return cacheService.getMenuItem(item.id);
            });
            const results = await Promise.all(promises);
            const endTime = perf_hooks_1.performance.now();
            const totalTime = endTime - startTime;
            const avgResponseTime = totalTime / menuItems.length;
            expect(avgResponseTime).toBeLessThan(PERFORMANCE_THRESHOLDS.api.maxResponseTime);
            expect(results).toHaveLength(menuItems.length);
            expect(results.every(r => r !== null)).toBe(true);
            console.log(`Menu retrieval performance: ${avgResponseTime.toFixed(2)}ms average response time`);
        });
        it('should handle nutritional analysis with acceptable performance', async () => {
            const testMenuItems = Array.from({ length: 50 }, (_, i) => ({
                id: `nutrition_item_${i}`,
                name: `Nutrition Test Item ${i}`,
                ingredients: [
                    {
                        name: 'Base Ingredient',
                        quantity: '100g',
                        nutritionalValue: {
                            calories: 100 + (i % 200),
                            protein: 5 + (i % 15),
                            carbohydrates: 20 + (i % 30),
                            fat: 3 + (i % 10)
                        }
                    },
                ],
            }));
            const times = [];
            for (const item of testMenuItems) {
                const startTime = perf_hooks_1.performance.now();
                const analysis = await nutritionalService.analyzeNutritionalContent(item);
                const endTime = perf_hooks_1.performance.now();
                times.push(endTime - startTime);
                expect(analysis).toBeDefined();
                expect(analysis.totalCalories).toBeGreaterThan(0);
            }
            const avgAnalysisTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxAnalysisTime = Math.max(...times);
            const p95Time = times.sort((a, b) => a - b)[Math.floor(times.length * 0.95)];
            expect(avgAnalysisTime).toBeLessThan(50);
            expect(p95Time).toBeLessThan(100);
            expect(maxAnalysisTime).toBeLessThan(200);
            console.log(`Nutritional analysis performance: ${avgAnalysisTime.toFixed(2)}ms avg, ${p95Time.toFixed(2)}ms P95`);
        });
        it('should maintain performance under concurrent load', async () => {
            const concurrentUsers = 100;
            const requestsPerUser = 10;
            const totalRequests = concurrentUsers * requestsPerUser;
            const startTime = perf_hooks_1.performance.now();
            const userPromises = Array.from({ length: concurrentUsers }, async (_, userIndex) => {
                const userRequests = Array.from({ length: requestsPerUser }, async (_, reqIndex) => {
                    const requestStart = perf_hooks_1.performance.now();
                    const requestType = reqIndex % 4;
                    let result;
                    switch (requestType) {
                        case 0: {
                            result = await cacheService.getMenuItem(`item_${userIndex}_${reqIndex}`);
                            break;
                        }
                        case 1: {
                            const item = { id: `test_${userIndex}_${reqIndex}`, name: `Test Item ${userIndex}_${reqIndex}`, ingredients: [] };
                            result = await nutritionalService.analyzeNutritionalContent(item);
                            break;
                        }
                        case 2: {
                            await cacheService.set(`test:${userIndex}:${reqIndex}`, { data: true }, 300);
                            result = await cacheService.get(`test:${userIndex}:${reqIndex}`);
                            break;
                        }
                        case 3: {
                            result = await monitoringService.getSystemMetrics();
                            break;
                        }
                    }
                    const requestEnd = perf_hooks_1.performance.now();
                    return {
                        userId: userIndex,
                        requestIndex: reqIndex,
                        type: requestType,
                        duration: requestEnd - requestStart,
                        success: result !== null,
                    };
                });
                return Promise.all(userRequests);
            });
            const allResults = await Promise.all(userPromises);
            const endTime = perf_hooks_1.performance.now();
            const totalTime = endTime - startTime;
            const throughput = totalRequests / (totalTime / 1000);
            const flatResults = allResults.flat();
            const responseTimes = flatResults.map(r => r.duration);
            const successRate = flatResults.filter(r => r.success).length / flatResults.length;
            const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
            const p95ResponseTime = responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)];
            expect(throughput).toBeGreaterThan(50);
            expect(avgResponseTime).toBeLessThan(500);
            expect(p95ResponseTime).toBeLessThan(1000);
            expect(successRate).toBeGreaterThan(0.95);
            console.log(`Concurrent load performance:
        - Throughput: ${throughput.toFixed(2)} req/s
        - Avg response: ${avgResponseTime.toFixed(2)}ms
        - P95 response: ${p95ResponseTime.toFixed(2)}ms
        - Success rate: ${(successRate * 100).toFixed(2)}%`);
        });
    });
    describe('Cache Performance', () => {
        it('should meet cache operation performance thresholds', async () => {
            const testData = Array.from({ length: 1000 }, (_, i) => ({
                key: `cache_perf_${i}`,
                value: {
                    id: i,
                    data: `Test data ${i}`,
                    timestamp: Date.now(),
                    metadata: { type: 'performance_test', index: i },
                },
            }));
            const setTimes = [];
            for (const item of testData) {
                const startTime = perf_hooks_1.performance.now();
                await cacheService.set(item.key, item.value, 3600);
                const endTime = perf_hooks_1.performance.now();
                setTimes.push(endTime - startTime);
            }
            const getTimes = [];
            for (const item of testData) {
                const startTime = perf_hooks_1.performance.now();
                const result = await cacheService.get(item.key);
                const endTime = perf_hooks_1.performance.now();
                getTimes.push(endTime - startTime);
                expect(result).toEqual(item.value);
            }
            const avgSetTime = setTimes.reduce((a, b) => a + b, 0) / setTimes.length;
            const avgGetTime = getTimes.reduce((a, b) => a + b, 0) / getTimes.length;
            const maxSetTime = Math.max(...setTimes);
            const maxGetTime = Math.max(...getTimes);
            expect(avgSetTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cache.maxSetTime);
            expect(avgGetTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cache.maxGetTime);
            expect(maxSetTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cache.maxSetTime * 5);
            expect(maxGetTime).toBeLessThan(PERFORMANCE_THRESHOLDS.cache.maxGetTime * 5);
            console.log(`Cache performance:
        - Avg SET: ${avgSetTime.toFixed(2)}ms
        - Avg GET: ${avgGetTime.toFixed(2)}ms
        - Max SET: ${maxSetTime.toFixed(2)}ms
        - Max GET: ${maxGetTime.toFixed(2)}ms`);
        });
        it('should maintain cache hit rate under load', async () => {
            const popularKeys = Array.from({ length: 100 }, (_, i) => `popular_item_${i}`);
            const randomKeys = Array.from({ length: 1000 }, (_, i) => `random_item_${i}`);
            for (const key of popularKeys) {
                await cacheService.set(key, { popular: true, key }, 3600);
            }
            let hits = 0;
            let misses = 0;
            const totalRequests = 10000;
            for (let i = 0; i < totalRequests; i++) {
                let key;
                if (Math.random() < 0.8) {
                    key = popularKeys[Math.floor(Math.random() * popularKeys.length)];
                }
                else {
                    key = randomKeys[Math.floor(Math.random() * randomKeys.length)];
                }
                const result = await cacheService.get(key);
                if (result !== null) {
                    hits++;
                }
                else {
                    misses++;
                }
            }
            const hitRate = (hits / totalRequests) * 100;
            expect(hitRate).toBeGreaterThan(75);
            console.log(`Cache hit rate performance: ${hitRate.toFixed(2)}% (${hits} hits, ${misses} misses)`);
        });
        it('should handle cache invalidation efficiently', async () => {
            const numItems = 1000;
            const numTags = 10;
            for (let i = 0; i < numItems; i++) {
                const tags = [`tag_${i % numTags}`, `category_${Math.floor(i / 100)}`];
                await cacheService.setWithTags(`tagged_item_${i}`, { id: i }, 3600, tags);
            }
            const startTime = perf_hooks_1.performance.now();
            await cacheService.invalidateByTags([`tag_${Math.floor(numTags / 2)}`]);
            const endTime = perf_hooks_1.performance.now();
            const invalidationTime = endTime - startTime;
            expect(invalidationTime).toBeLessThan(100);
            for (let i = 0; i < numItems; i++) {
                const result = await cacheService.get(`tagged_item_${i}`);
                if (i % numTags === Math.floor(numTags / 2)) {
                    expect(result).toBeNull();
                }
                else {
                    expect(result).not.toBeNull();
                }
            }
            console.log(`Cache invalidation performance: ${invalidationTime.toFixed(2)}ms for tag-based invalidation`);
        });
    });
    describe('Database Performance', () => {
        it('should handle bulk nutritional analysis efficiently', async () => {
            const bulkMenuItems = Array.from({ length: 500 }, (_, i) => ({
                id: `bulk_item_${i}`,
                name: `Bulk Test Item ${i}`,
                ingredients: [
                    {
                        name: 'Ingredient A',
                        nutritionalValue: { calories: 100, protein: 5, carbohydrates: 15, fat: 3 }
                    },
                    {
                        name: 'Ingredient B',
                        nutritionalValue: { calories: 50, protein: 2, carbohydrates: 8, fat: 1 }
                    },
                ],
            }));
            const startTime = perf_hooks_1.performance.now();
            const results = await nutritionalService.batchNutritionalAnalysis(bulkMenuItems);
            const endTime = perf_hooks_1.performance.now();
            const totalTime = endTime - startTime;
            const avgTimePerItem = totalTime / bulkMenuItems.length;
            expect(results.results).toHaveLength(bulkMenuItems.length);
            expect(avgTimePerItem).toBeLessThan(10);
            expect(totalTime).toBeLessThan(5000);
            console.log(`Bulk analysis performance: ${totalTime.toFixed(2)}ms total, ${avgTimePerItem.toFixed(2)}ms per item`);
        });
        it('should handle concurrent database operations efficiently', async () => {
            const concurrentOperations = 100;
            const startTime = perf_hooks_1.performance.now();
            const operations = Array.from({ length: concurrentOperations }, async (_, i) => {
                const menuItem = {
                    id: `concurrent_db_${i}`,
                    name: `Concurrent DB Test ${i}`,
                    ingredients: [{ name: 'Test Ingredient', nutritionalValue: { calories: 100, protein: 5, carbohydrates: 10, fat: 2 } }],
                };
                return nutritionalService.analyzeNutritionalContent(menuItem);
            });
            const results = await Promise.all(operations);
            const endTime = perf_hooks_1.performance.now();
            const totalTime = endTime - startTime;
            const avgTime = totalTime / concurrentOperations;
            expect(results).toHaveLength(concurrentOperations);
            expect(results.every(r => r !== null)).toBe(true);
            expect(avgTime).toBeLessThan(100);
            console.log(`Concurrent DB operations: ${totalTime.toFixed(2)}ms total, ${avgTime.toFixed(2)}ms average`);
        });
    });
    describe('Memory Usage Performance', () => {
        it('should not leak memory during sustained operations', async () => {
            const initialMemory = process.memoryUsage();
            const duration = 30000;
            const startTime = Date.now();
            let operationCount = 0;
            while (Date.now() - startTime < duration) {
                const operationType = operationCount % 4;
                switch (operationType) {
                    case 0: {
                        await cacheService.set(`memory_test_${operationCount}`, { data: `Test ${operationCount}` }, 60);
                        break;
                    }
                    case 1: {
                        await cacheService.get(`memory_test_${operationCount - 10}`);
                        break;
                    }
                    case 2: {
                        const item = { id: `mem_${operationCount}`, name: `Memory Test Item ${operationCount}`, ingredients: [] };
                        await nutritionalService.analyzeNutritionalContent(item);
                        break;
                    }
                    case 3: {
                        await monitoringService.logMetric('performance_test', operationCount);
                        break;
                    }
                }
                operationCount++;
                if (operationCount % 100 === 0) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            if (global.gc) {
                global.gc();
                global.gc();
            }
            const finalMemory = process.memoryUsage();
            const memoryGrowth = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
            console.log(`Memory usage test:
        - Operations performed: ${operationCount}
        - Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        - Final heap: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)} MB
        - Memory growth: ${memoryGrowth.toFixed(2)} MB`);
            expect(memoryGrowth).toBeLessThan(PERFORMANCE_THRESHOLDS.api.maxMemoryUsage);
        });
        it('should handle large dataset processing efficiently', async () => {
            const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
                id: `large_dataset_${i}`,
                name: `Large Dataset Item ${i}`,
                data: Array.from({ length: 100 }, (_, j) => `data_${i}_${j}`),
                metadata: {
                    category: `category_${i % 50}`,
                    tags: [`tag_${i % 100}`, `type_${i % 20}`],
                    timestamp: Date.now(),
                },
            }));
            const startTime = perf_hooks_1.performance.now();
            const initialMemory = process.memoryUsage().heapUsed;
            const chunks = [];
            const chunkSize = 1000;
            for (let i = 0; i < largeDataset.length; i += chunkSize) {
                const chunk = largeDataset.slice(i, i + chunkSize);
                const processed = chunk.map((item) => ({
                    ...item,
                    processed: true,
                    processedAt: Date.now(),
                }));
                chunks.push(processed);
                chunk.length = 0;
            }
            const endTime = perf_hooks_1.performance.now();
            const finalMemory = process.memoryUsage().heapUsed;
            const processingTime = endTime - startTime;
            const memoryUsed = (finalMemory - initialMemory) / (1024 * 1024);
            expect(processingTime).toBeLessThan(5000);
            expect(memoryUsed).toBeLessThan(200);
            expect(chunks).toHaveLength(Math.ceil(largeDataset.length / chunkSize));
            console.log(`Large dataset processing:
        - Items processed: ${largeDataset.length}
        - Processing time: ${processingTime.toFixed(2)}ms
        - Memory used: ${memoryUsed.toFixed(2)} MB
        - Rate: ${(largeDataset.length / (processingTime / 1000)).toFixed(0)} items/sec`);
        });
    });
    describe('Real-World Scenario Performance', () => {
        it('should handle peak lunch hour simulation', async () => {
            const studentCount = 500;
            const ordersPerStudent = 2;
            const totalOperations = studentCount * ordersPerStudent;
            const startTime = perf_hooks_1.performance.now();
            const studentPromises = Array.from({ length: studentCount }, async (_, studentId) => {
                const operations = [];
                for (let orderAttempt = 0; orderAttempt < ordersPerStudent; orderAttempt++) {
                    const opStart = perf_hooks_1.performance.now();
                    await cacheService.getSchoolMenu('school_123', '2024-01-15', 'LUNCH');
                    const menuItems = ['item_1', 'item_2', 'item_3'];
                    for (const itemId of menuItems) {
                        await cacheService.getMenuItem(itemId);
                    }
                    const testItem = {
                        id: `student_${studentId}_item`,
                        name: `Student Test Item ${studentId}`,
                        ingredients: [{ name: 'Test', nutritionalValue: { calories: 300, protein: 10, carbohydrates: 20, fat: 5 } }],
                    };
                    await nutritionalService.analyzeNutritionalContent(testItem);
                    const order = {
                        id: `order_${studentId}_${orderAttempt}`,
                        studentId: `student_${studentId}`,
                        items: menuItems,
                        timestamp: Date.now(),
                    };
                    await cacheService.cacheOrder(order);
                    const opEnd = perf_hooks_1.performance.now();
                    operations.push(opEnd - opStart);
                }
                return operations;
            });
            const allOperations = await Promise.all(studentPromises);
            const endTime = perf_hooks_1.performance.now();
            const totalTime = endTime - startTime;
            const flatOperations = allOperations.flat();
            const avgOperationTime = flatOperations.reduce((a, b) => a + b, 0) / flatOperations.length;
            const throughput = totalOperations / (totalTime / 1000);
            expect(throughput).toBeGreaterThan(20);
            expect(avgOperationTime).toBeLessThan(1000);
            expect(totalTime).toBeLessThan(60000);
            console.log(`Peak lunch hour simulation:
        - Students: ${studentCount}
        - Total operations: ${totalOperations}
        - Total time: ${(totalTime / 1000).toFixed(2)}s
        - Throughput: ${throughput.toFixed(2)} ops/sec
        - Avg operation time: ${avgOperationTime.toFixed(2)}ms`);
        });
        it('should maintain performance during system stress test', async () => {
            const scenarios = [
                async () => {
                    const operations = 1000;
                    for (let i = 0; i < operations; i++) {
                        await cacheService.set(`stress_cache_${i}`, { data: i }, 300);
                        if (i % 10 === 0) {
                            await cacheService.get(`stress_cache_${i - 5}`);
                        }
                    }
                    return operations;
                },
                async () => {
                    const analyses = 200;
                    const promises = Array.from({ length: analyses }, (_, i) => {
                        const item = {
                            id: `stress_nutrition_${i}`,
                            name: `Stress Nutrition Item ${i}`,
                            ingredients: Array.from({ length: 5 }, (_, j) => ({
                                name: `ingredient_${j}`,
                                nutritionalValue: { calories: 50 + j * 10, protein: j + 2, carbohydrates: 10 + j * 5, fat: 2 + j },
                            })),
                        };
                        return nutritionalService.analyzeNutritionalContent(item);
                    });
                    await Promise.all(promises);
                    return analyses;
                },
                async () => {
                    const operations = 500;
                    for (let i = 0; i < operations; i++) {
                        const menuItem = {
                            id: `stress_menu_${i}`,
                            name: `Stress Menu Item ${i}`,
                            ingredients: [{ name: 'Stress Test', nutritionalValue: { calories: 200, protein: 10, carbohydrates: 15, fat: 5 } }],
                        };
                        await nutritionalService.analyzeNutritionalContent(menuItem);
                        if (i % 50 === 0) {
                            await monitoringService.getSystemMetrics();
                        }
                    }
                    return operations;
                },
            ];
            const startTime = perf_hooks_1.performance.now();
            const initialMemory = process.memoryUsage();
            const results = await Promise.all(scenarios.map(scenario => scenario()));
            const endTime = perf_hooks_1.performance.now();
            const finalMemory = process.memoryUsage();
            const totalTime = endTime - startTime;
            const totalOperations = results.reduce((sum, count) => sum + count, 0);
            const memoryIncrease = (finalMemory.heapUsed - initialMemory.heapUsed) / (1024 * 1024);
            const operationsPerSecond = totalOperations / (totalTime / 1000);
            expect(totalTime).toBeLessThan(30000);
            expect(memoryIncrease).toBeLessThan(150);
            expect(operationsPerSecond).toBeGreaterThan(50);
            console.log(`System stress test results:
        - Total operations: ${totalOperations}
        - Execution time: ${(totalTime / 1000).toFixed(2)}s
        - Operations/sec: ${operationsPerSecond.toFixed(2)}
        - Memory increase: ${memoryIncrease.toFixed(2)}MB`);
        });
    });
    describe('Performance Monitoring and Metrics', () => {
        it('should provide accurate performance metrics', async () => {
            const operations = [
                { type: 'cache_set', count: 100 },
                { type: 'cache_get', count: 200 },
                { type: 'nutrition_analysis', count: 50 },
                { type: 'monitoring_log', count: 25 },
            ];
            const metricsBefore = await monitoringService.getPerformanceMetrics();
            const startTime = Date.now();
            for (const op of operations) {
                for (let i = 0; i < op.count; i++) {
                    switch (op.type) {
                        case 'cache_set': {
                            await cacheService.set(`metrics_test_${i}`, { operation: op.type }, 300);
                            break;
                        }
                        case 'cache_get': {
                            await cacheService.get(`metrics_test_${i % 100}`);
                            break;
                        }
                        case 'nutrition_analysis': {
                            const item = { id: `metrics_${i}`, name: `Metrics Test Item ${i}`, ingredients: [] };
                            await nutritionalService.analyzeNutritionalContent(item);
                            break;
                        }
                        case 'monitoring_log': {
                            await monitoringService.logMetric(`test_metric_${i}`, i);
                            break;
                        }
                    }
                }
            }
            const endTime = Date.now();
            const metricsAfter = await monitoringService.getPerformanceMetrics();
            const totalOperations = operations.reduce((sum, op) => sum + op.count, 0);
            const executionTime = endTime - startTime;
            const expectedThroughput = totalOperations / (executionTime / 1000);
            expect(metricsAfter.timestamp).toBeGreaterThan(metricsBefore.timestamp);
            expect(metricsAfter.operations.total).toBeGreaterThanOrEqual(metricsBefore.operations.total);
            console.log(`Performance metrics validation:
        - Operations performed: ${totalOperations}
        - Execution time: ${executionTime}ms
        - Expected throughput: ${expectedThroughput.toFixed(2)} ops/sec
        - Metrics captured: ${JSON.stringify(metricsAfter.operations)}`);
        });
    });
});
//# sourceMappingURL=hasivu-platform.performance.test.js.map