import { getActiveFolder, getFolderByName, getFileByName } from '../services/drive';
import { getProperty, getProperties, setProperties } from '../services/properties';

import { ProjectBuiltinSettings, ProjectSettings } from '../types';

// built-in
export const PROJECT_ID_KEY = 'PROJECT_ID';
export const PROJECT_NAME_KEY = 'PROJECT_NAME';
export const DATABASE_ID_KEY = 'DATABASE_ID';
export const BACKEND_ID_KEY = 'BACKEND_ID';
export const UPLOAD_ID_KEY = 'UPLOAD_ID';
export const CONTENT_ID_KEY = 'CONTENT_ID';
export const STORAGE_ID_KEY = 'STORAGE_ID';
// custom
export const HOMEPAGE_KEY = 'HOMEPAGE';
export const GCP_ID_KEY = 'GCP_ID';
export const WEBHOOK_URL_KEY = 'WEBHOOK_URL';

/**
 * folders & files
 */

export function getProjectFolder() {
  return getActiveFolder();
}

export function getProjectFolderWithInfo(folder?: GoogleAppsScript.Drive.Folder) {
  folder = folder || getProjectFolder();
  const id = folder.getId();
  const name = folder.getName().replace('Sheetbase: ', '');
  return { folder, id, name };
}

export function getUploadFolder(projectFolder?: GoogleAppsScript.Drive.Folder) {
  const { folder, name } = getProjectFolderWithInfo(projectFolder);
  return getFolderByName(name + ' Upload', folder);
}

export function getContentFolder(projectFolder?: GoogleAppsScript.Drive.Folder) {
  const { folder, name } = getProjectFolderWithInfo(projectFolder);
  return getFolderByName(name + ' Content', folder);
}

export function getContentFolderChild(
  contentType: string,
  projectFolder?: GoogleAppsScript.Drive.Folder,
) {
  const contentFolder = getContentFolder(projectFolder);
  const childName = contentType.charAt(0).toUpperCase() + contentType.slice(1);
  return getFolderByName(childName, contentFolder);
}

export function getStorageFolder(projectFolder?: GoogleAppsScript.Drive.Folder) {
  const { folder, name } = getProjectFolderWithInfo(projectFolder);
  return getFolderByName(name + ' Storage', folder);
}

export function getStorageFolderChild(
  mimeType: string,
  projectFolder?: GoogleAppsScript.Drive.Folder,
) {
  const storageFolder = getStorageFolder(projectFolder);
  let childName: string;
  if (mimeType.substr(0, 6) === 'image/') {
    childName = 'Images';
  } else if (mimeType.substr(0, 6) === 'audio/') {
    childName = 'Audios';
  } else if (mimeType.substr(0, 6) === 'video/') {
    childName = 'Videos';
  } else if (
    mimeType === 'text/plain' ||
    mimeType === 'application/pdf'
  ) {
    childName = 'Documents';
  } else {
    childName = 'Files';
  }
  return getFolderByName(childName, storageFolder);
}

export function getDatabaseFile(projectFolder?: GoogleAppsScript.Drive.Folder) {
  const { folder, name } = getProjectFolderWithInfo(projectFolder);
  return getFileByName(folder, name + ' Database');
}

export function getBackendFile(projectFolder?: GoogleAppsScript.Drive.Folder) {
  const { folder, name } = getProjectFolderWithInfo(projectFolder);
  return getFileByName(folder, name + ' Backend');
}

/**
 * get/set all settings
 */

export function getSettings(freshBuiltin = false) {
  let settings: ProjectSettings = getProperties();
  // fresh builtin or no builtin
  if (!!freshBuiltin || !settings[PROJECT_ID_KEY]) {
    // get builtin
    const { folder, id, name } = getProjectFolderWithInfo();
    const database = getDatabaseFile(folder);
    const backend = getBackendFile(folder);
    const upload = getUploadFolder(folder);
    const content = getContentFolder(folder);
    const storage = getStorageFolder(folder);
    const builtinSettings = setProperties(
      {
        [PROJECT_ID_KEY]: id,
        [PROJECT_NAME_KEY]: name,
        [DATABASE_ID_KEY]: database.getId(),
        [BACKEND_ID_KEY]: backend.getId(),
        [UPLOAD_ID_KEY]: upload.getId(),
        [CONTENT_ID_KEY]: content.getId(),
        [STORAGE_ID_KEY]: storage.getId(),
      } as ProjectBuiltinSettings,
    );
    // add buitin to settings
    settings = { ... settings, ... builtinSettings };
  }
  return settings;
}

export function setSettings(settings: ProjectSettings) {
  return setProperties(settings);
}

/**
 * get a single setting
 */

export function getSetting(key: string) {
  return getProperty(key);
}

export function getSettingProject() {
  const id = getSetting(PROJECT_ID_KEY);
  const name = getSetting(PROJECT_NAME_KEY);
  return { id, name };
}

export function getSettingDatabaseId() {
  return getSetting(DATABASE_ID_KEY);
}

export function getSettingBackendId() {
  return getSetting(BACKEND_ID_KEY);
}

export function getSettingUploadId() {
  return getSetting(UPLOAD_ID_KEY);
}

export function getSettingContentId() {
  return getSetting(CONTENT_ID_KEY);
}

export function getSettingStorageId() {
  return getSetting(STORAGE_ID_KEY);
}

export function getSettingHomepage() {
  return getSetting(HOMEPAGE_KEY);
}

export function getSettingGCPId() {
  return getSetting(GCP_ID_KEY);
}

export function getSettingWebhookUrl() {
  return getSetting(WEBHOOK_URL_KEY);
}
