export type SetMode = 'raw' | 'url' | 'jsonx';

export interface ParsedLoaderValue {
  isExternal?: boolean;
  value?: string;
}