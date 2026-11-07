/**
 * PadiBase TypeScript Types & Interfaces
 */
export interface RecordModel {
    id: string;
    created?: string;
    updated?: string;
    [key: string]: any;
}
export interface ListResult<T = RecordModel> {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}
export interface SendOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | string;
    params?: Record<string, any>;
    query?: Record<string, any>;
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
    fetch?: typeof fetch;
}
export interface CommonQueryParams {
    filter?: string;
    sort?: string;
    search?: string;
    q?: string;
    [key: string]: any;
}
export interface RecordListOptions extends SendOptions, CommonQueryParams {
    page?: number;
    perPage?: number;
}
export interface RecordFullListOptions extends SendOptions, CommonQueryParams {
    limit?: number;
    offset?: number;
}
export interface RecordOptions extends SendOptions, CommonQueryParams {
}
export interface RecordAuthResponse<T = RecordModel> {
    token: string;
    record: T;
}
export interface RealtimeMessage<T = RecordModel> {
    action: 'create' | 'update' | 'delete' | string;
    table: string;
    record: T;
}
export type RealtimeCallback<T = RecordModel> = (message: RealtimeMessage<T>) => void;
//# sourceMappingURL=types.d.ts.map