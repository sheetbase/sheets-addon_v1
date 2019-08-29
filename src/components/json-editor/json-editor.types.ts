export type SetMode = 'RAW' | 'CURRENT' | 'NEW_INTERNAL' | 'NEW_EXTERNAL';

export interface SourceInfo {
  isExternal?: boolean;
  id?: string;
  url?: string;
}

export interface EditorData {
  source?: string;
  sourceUrl?: string;
  autoLoaded?: boolean;
  jsonText?: string;
}
