export declare class MenuService {
    constructor();
    getMenuItems(): Promise<any[]>;
    createMenuItem(item: any): Promise<any>;
    updateMenuItem(id: string, updates: any): Promise<void>;
    deleteMenuItem(id: string): Promise<void>;
    getMenuByCategory(_category: string): Promise<any[]>;
}
declare const menuServiceInstance: MenuService;
export declare const menuService: MenuService;
export declare const _menuService: MenuService;
export default menuServiceInstance;
//# sourceMappingURL=menu.service.d.ts.map