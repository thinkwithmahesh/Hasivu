"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
class InMemoryCache {
    cache;
    constructor() {
        this.cache = new Map();
    }
    async get(key) {
        const item = this.cache.get(key);
        if (!item) {
            return null;
        }
        if (item.expiry && Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }
    async set(key, value) {
        this.cache.set(key, { value });
    }
    async setex(key, seconds, value) {
        const expiry = Date.now() + (seconds * 1000);
        this.cache.set(key, { value, expiry });
    }
    async del(key) {
        const existed = this.cache.has(key);
        this.cache.delete(key);
        return existed ? 1 : 0;
    }
    async exists(key) {
        const item = this.cache.get(key);
        if (!item) {
            return false;
        }
        if (item.expiry && Date.now() > item.expiry) {
            this.cache.delete(key);
            return false;
        }
        return true;
    }
    async clear() {
        this.cache.clear();
    }
    size() {
        return this.cache.size;
    }
}
exports.cache = new InMemoryCache();
//# sourceMappingURL=cache.js.map