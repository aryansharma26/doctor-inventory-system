export type ApiSuccess<T> = { success: true; data: T };
export type Paginated<T> = ApiSuccess<T[]> & {
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

