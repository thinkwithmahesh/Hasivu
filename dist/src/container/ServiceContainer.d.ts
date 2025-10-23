import { IOrderRepository, IOrderItemRepository, IMenuItemRepository, IUserRepository, IPaymentOrderRepository, IDatabaseService, INotificationService, IPaymentService, IRedisService } from '../interfaces/repository.interfaces';
export interface IServiceContainer {
    orderRepository: IOrderRepository;
    orderItemRepository: IOrderItemRepository;
    menuItemRepository: IMenuItemRepository;
    userRepository: IUserRepository;
    paymentOrderRepository: IPaymentOrderRepository;
    databaseService: IDatabaseService;
    notificationService: INotificationService;
    paymentService: IPaymentService;
    redisService: IRedisService;
}
export declare class ServiceContainer implements IServiceContainer {
    readonly orderRepository: IOrderRepository;
    readonly orderItemRepository: IOrderItemRepository;
    readonly menuItemRepository: IMenuItemRepository;
    readonly userRepository: IUserRepository;
    readonly paymentOrderRepository: IPaymentOrderRepository;
    readonly databaseService: IDatabaseService;
    readonly notificationService: INotificationService;
    readonly paymentService: IPaymentService;
    readonly redisService: IRedisService;
    constructor(dependencies: IServiceContainer);
    static createProductionContainer(): ServiceContainer;
    static createTestContainer(overrides?: Partial<IServiceContainer>): ServiceContainer;
}
export declare function getProductionContainer(): ServiceContainer;
export declare function getTestContainer(overrides?: Partial<IServiceContainer>): ServiceContainer;
export declare function resetContainers(): void;
//# sourceMappingURL=ServiceContainer.d.ts.map