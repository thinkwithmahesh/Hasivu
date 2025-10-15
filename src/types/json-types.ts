/**
 * Generic JSON type utilities for flexible data structures
 * Use these instead of 'any' for better type safety
 */

/**
 * Represents any valid JSON value
 * @example
 * const data: JsonValue = { name: "test", count: 42 };
 * const list: JsonValue = [1, 2, 3];
 * const simple: JsonValue = "hello";
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * Represents a JSON object with string keys and JsonValue values
 * @example
 * const user: JsonObject = { id: 1, name: "John", active: true };
 */
export interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Represents a JSON array containing JsonValue elements
 * @example
 * const items: JsonArray = [1, "two", { three: 3 }, [4]];
 */
export type JsonArray = JsonValue[];

/**
 * Type-safe unknown for cases where the type is truly unknown
 * Prefer this over 'any' when you need to accept any type but want to force type checking
 */
export type SafeUnknown = unknown;

/**
 * Generic API response wrapper
 */
export interface ApiPayload<T = JsonValue> {
  data: T;
  status?: number;
  message?: string;
  errors?: string[];
}

/**
 * Type guard to check if a value is a JsonObject
 */
export function isJsonObject(value: JsonValue): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is a JsonArray
 */
export function isJsonArray(value: JsonValue): value is JsonArray {
  return Array.isArray(value);
}
