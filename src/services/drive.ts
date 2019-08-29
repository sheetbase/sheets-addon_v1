import { getCache, setCache } from './cache';

import {
  DriveSharingValue,
  DriveSharing,
  DriveItemInfo,
  DriveFolderInfo,
  DriveFileInfo,
} from '../types';

// https://developers.google.com/apps-script/reference/drive/drive-app

/**
 *
 * static
 */

export const SHARING_PRESETS: { [preset: string]: DriveSharingValue } = {
  PUBLIC: {
    access: 'ANYONE_WITH_LINK',
    permission: 'VIEW',
  },
  PRIVATE: {
    access: 'PRIVATE',
    permission: 'NONE',
  },
};

/**
 *
 * drive general
 */

export function getDriveItemInfo(
  item: GoogleAppsScript.Drive.File | GoogleAppsScript.Drive.Folder,
): DriveItemInfo {
  const id = item.getId();
  const name = item.getName();
  const description = item.getDescription();
  const created = item.getDateCreated().toISOString();
  const updated = item.getLastUpdated().toISOString();
  const link = item.getUrl();
  const size = item.getSize();
  const access = '' + item.getSharingAccess();
  const permission = '' + item.getSharingPermission();
  return {
    id,
    name,
    description,
    created,
    updated,
    link,
    size,
    sharing: { access, permission },
  };
}

/**
 *
 * project folder
 */

export function getActiveFolder() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  return DriveApp.getFileById(id).getParents().next();
}

/**
 *
 * folder
 */

export function getFolderById(id: string) {
  return DriveApp.getFolderById(id);
}

export function getFolderByName(
  name: string,
  parentFolder?: GoogleAppsScript.Drive.Folder,
) {
  return getFolderByPath(name, parentFolder);
}

export function getFolderByPath(
  path: string,
  parentFolder?: GoogleAppsScript.Drive.Folder,
) {
  let folder: GoogleAppsScript.Drive.Folder;
  const folderNames = path.split('/').map(x => x.trim());
  // create folders
  folder = parentFolder || getActiveFolder();
  for (let i = 0; i < folderNames.length; i++) {
    const folderName = folderNames[i];
    // get all children
    // and return the first
    // or create new one
    const childFolders = folder.getFoldersByName(folderName);
    if(!childFolders.hasNext()) {
      folder = folder.createFolder(folderName);
    } else {
      folder = childFolders.next();
    }
  }
  // final result
  return folder;
}

export function getFolderInfo(folder: GoogleAppsScript.Drive.Folder): DriveFolderInfo {
  const _getFolderInfo = () => getDriveItemInfo(folder);
  // get & cache
  const cacheKey = 'DRIVE_FOLDER_INFO_' + folder.getId();
  return (
    getCache<DriveFolderInfo>(cacheKey) ||
    setCache<DriveFolderInfo>(cacheKey, _getFolderInfo(), 3600)
  );
}

/**
 *
 * file
 */

export function buildFileUCUrl(id: string) {
  return 'https://drive.google.com/uc?id=' + id;
}

export function extractFileIdFromUrl(url: string) {
  // share/edit/view (https://drive.google.com/file/d/<id>/...)
  // open id (https://drive.google.com/open?id=<id>[&...])
  // uc id (https://drive.google.com/uc?id=<id>[&...])
  return url
    .replace('https://drive.google.com/', '')
    .replace('file/d/', '')
    .split('/').shift()
    .split('id=').pop()
    .split('&').shift();
}

export function getFileById(id: string) {
  return DriveApp.getFileById(id);
}

export function getFileByName(
  folder: GoogleAppsScript.Drive.Folder,
  name: string,
) {
  const childFiles = folder.getFilesByName(name);
  return !!childFiles.hasNext() ? childFiles.next() : null;
}

export function createFile(
  parentFolder: GoogleAppsScript.Drive.Folder,
  blob: GoogleAppsScript.Base.Blob,
  sharing: DriveSharing = 'PUBLIC',
) {
  const share = (typeof sharing === 'string') ? SHARING_PRESETS[sharing] : sharing;
  // create file
  return parentFolder
  .createFile(blob)
  .setSharing(
    DriveApp.Access[share.access || 'PRIVATE'],
    DriveApp.Permission[share.permission || 'NONE'],
  );
}

export function createFileFromString(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  mimeType: string,
  content: string,
  sharing: DriveSharing = 'PUBLIC',
) {
  // create file
  const blob = Utilities.newBlob(content, mimeType, name);
  return createFile(parentFolder, blob, sharing);
}

export function createFileText(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: DriveSharing = 'PUBLIC',
) {
  return createFileFromString(parentFolder, name, 'text/plain', content, sharing);
}

export function createFileJSON(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: DriveSharing = 'PUBLIC',
) {
  return createFileFromString(parentFolder, name, 'application/json', content, sharing);
}

export function createFileHTML(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: DriveSharing = 'PUBLIC',
) {
  return createFileFromString(parentFolder, name, 'text/html', content, sharing);
}

export function getFileInfo(file: GoogleAppsScript.Drive.File): DriveFileInfo {
  const _getFileInfo = () => {
    const fileInfo = getDriveItemInfo(file);
    const mimeType = file.getMimeType();
    const url = buildFileUCUrl(fileInfo.id);
    const downloadUrl = url + '&export=download';
    return {
      ... fileInfo,
      mimeType,
      url,
      downloadUrl,
    };
  };
  // get & cache
  const cacheKey = 'DRIVE_FILE_INFO_' + file.getId();
  return (
    getCache<DriveFileInfo>(cacheKey) ||
    setCache<DriveFileInfo>(cacheKey, _getFileInfo(), 3600)
  );
}

export function getFileContent(file: GoogleAppsScript.Drive.File) {
  return file.getBlob().getDataAsString();
}

export function getFileContentById(id: string) {
  return getFileContent(getFileById(id));
}
