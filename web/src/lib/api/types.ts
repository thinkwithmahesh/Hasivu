// Simple API types stub for frontend
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
