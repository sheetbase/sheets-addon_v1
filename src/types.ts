/**
 * addon.js
 */

export type ErrorAlert = (error: string | Error, title?: string) => any;

/**
 * environment
 */

interface Run {
  withFailureHandler?(
    callback: {
      (error: Error): any;
    },
  ): Run;
  withSuccessHandler?<Value>(
    callback: {
      (value: Value): any;
    },
  ): Run;
  // GAS functions
  [name: string]: (... args: any[]) => any;
}

interface Script {
  run: Run;
}

export interface Google {
  script: Script;
}

/**
 * editor
 */

export type EditorSetMode = 'RAW' | 'CURRENT' | 'NEW_INTERNAL' | 'NEW_EXTERNAL';

export interface EditorSourceInfo {
  isExternal?: boolean;
  id?: string;
  url?: string;
}

export interface EditorData {
  source?: string;
  sourceUrl?: string;
  autoLoaded?: boolean;
  content?: string;
}

/**
 * project
 */

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

/**
 * Drive
 */

export type DriveSharing = DriveSharingPreset | DriveSharingValue;
type DriveSharingPreset = 'PUBLIC' | 'PRIVATE';
export interface DriveSharingValue {
  access?: string;
  permission?: string;
}

export interface DriveItemInfo {
  id: string;
  name: string;
  description: string;
  created: string;
  updated: string;
  link: string;
  size: number;
  sharing: DriveSharingValue;
}

export interface DriveFolderInfo extends DriveItemInfo {}
export interface DriveFileInfo extends DriveItemInfo {
  mimeType: string;
  url: string;
  downloadUrl: string;
}

/**
 * Fetch
 */

export type FetchMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/**
 * misc
 */

export interface ActionMessage {
  type: 'success' | 'warning' | 'error';
  message: string;
}
