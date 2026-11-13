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
  fields?: string;
  select?: string;
  with?: string | string[];
  expand?: string | string[];
  auto_load?: boolean;
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

export interface RecordOptions extends SendOptions, CommonQueryParams {}

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

export interface CountResult {
  collection: string;
  count: number;
  total: number;
}

export interface BatchDeleteResult {
  deleted: number;
  ids: string[];
  message?: string;
}

export interface TransactionOperation {
  action: 'create' | 'update' | 'delete' | 'insert' | 'sql' | string;
  collection?: string;
  id?: string;
  data?: Record<string, any>;
  sql?: string;
  params?: any[] | Record<string, any>;
}

export interface TransactionResult {
  committed: boolean;
  total_operations: number;
  results: any[];
}

export interface AdminModel {
  id: string;
  email: string;
  created: string;
  updated: string;
}

export interface AdminAuthResponse {
  token: string;
  admin: AdminModel;
}

export interface SchemaField {
  name: string;
  type: string;
  required?: boolean;
  options?: Record<string, any>;
}

export interface CollectionModel {
  id?: string;
  name: string;
  type?: 'base' | 'auth' | 'view' | string;
  schema?: SchemaField[];
  listRule?: string | null;
  viewRule?: string | null;
  createRule?: string | null;
  updateRule?: string | null;
  deleteRule?: string | null;
  allRule?: string | null;
  realtime?: boolean;
  auto_load_relations?: boolean;
  [key: string]: any;
}
