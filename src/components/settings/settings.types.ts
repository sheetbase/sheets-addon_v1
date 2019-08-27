export interface ProjectBuiltinInfo {
  PROJECT_ID?: string;
  PROJECT_NAME?: string;
  DATABASE_ID?: string;
  BACKEND_ID?: string;
  UPLOAD_ID?: string;
  CONTENT_ID?: string;
  STORAGE_ID?: string;
}

export interface ProjectCustomInfo {
  HOMEPAGE?: string;
  GCP_ID?: string;
  EDITOR_HOOK?: string;
}

export interface ProjectInfo extends ProjectBuiltinInfo, ProjectCustomInfo {}

export interface SettingActionMessage {
  type: 'success' | 'warning' | 'error';
  message: string;
}
