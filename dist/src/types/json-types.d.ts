export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;
export interface JsonObject {
    [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];
export type SafeUnknown = unknown;
export interface ApiPayload<T = JsonValue> {
    data: T;
    status?: number;
    message?: string;
    errors?: string[];
}
export declare function isJsonObject(value: JsonValue): value is JsonObject;
export declare function isJsonArray(value: JsonValue): value is JsonArray;
//# sourceMappingURL=json-types.d.ts.map