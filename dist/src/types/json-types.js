"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJsonArray = exports.isJsonObject = void 0;
function isJsonObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
exports.isJsonObject = isJsonObject;
function isJsonArray(value) {
    return Array.isArray(value);
}
exports.isJsonArray = isJsonArray;
//# sourceMappingURL=json-types.js.map