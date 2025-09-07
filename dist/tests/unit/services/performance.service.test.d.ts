declare global {
    namespace jest {
        interface Matchers<R> {
            toBeOneOf(expectedValues: any[]): R;
        }
    }
}
export {};
//# sourceMappingURL=performance.service.test.d.ts.map