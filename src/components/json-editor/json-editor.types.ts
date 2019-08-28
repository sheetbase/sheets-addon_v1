export interface Source {
  raw?: string;
  isExternal?: boolean;
  value?: string;
}

export type SetMode = 'RAW' | 'BY_SOURCE' | 'NEW_INTERNAL' | 'NEW_EXTERNAL';
