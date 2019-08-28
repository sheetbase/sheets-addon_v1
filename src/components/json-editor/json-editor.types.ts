export type SetMode = 'RAW' | 'CURRENT' | 'NEW_INTERNAL' | 'NEW_EXTERNAL';

export interface SourceData {
  isExternal?: boolean;
  id?: string;
  url?: string;
}

export interface LoadResult {
  source?: string;
  autoLoaded?: boolean;
  jsonText?: string;
}
