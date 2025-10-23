import { Browser, BrowserContext, Page } from 'playwright';
interface GlobalTestState {
    browser: Browser | null;
    context: BrowserContext | null;
    page: Page | null;
    baseUrl: string;
    apiBaseUrl: string;
    testUser: {
        email: string;
        password: string;
        role: string;
    };
}
declare global {
    var testState: GlobalTestState;
}
declare const TEST_CONFIG: {
    baseUrl: string;
    apiBaseUrl: string;
    headless: boolean;
    slowMo: number;
    timeout: {
        default: number;
        navigation: number;
        assertion: number;
    };
    viewport: {
        width: number;
        height: number;
    };
    testUser: {
        email: string;
        password: string;
        role: string;
    };
};
export declare const e2eHelpers: {
    login(email?: string, password?: string): Promise<void>;
    logout(): Promise<void>;
    navigateToPage(path: string): Promise<void>;
    makeApiRequest(endpoint: string, options?: any): Promise<import("playwright-core").APIResponse>;
    waitForText(selector: string, text: string, timeout?: number): Promise<void>;
    measurePageLoadTime(url: string): Promise<number>;
    takeScreenshot(name: string): Promise<void>;
};
export { TEST_CONFIG };
//# sourceMappingURL=setup-e2e.d.ts.map