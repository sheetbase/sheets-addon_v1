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
 * general
 */

export const DRIVE_URL = 'https://drive.google.com';

export const DRIVE_SHARING_PRESETS = {
  PUBLIC: {
    access: 'ANYONE_WITH_LINK',
    permission: 'VIEW',
  },
  PRIVATE: {
    access: 'PRIVATE',
    permission: 'NONE',
  },
} as {
  [preset: string]: DriveSharingValue;
};

export function isDriveFileId(id: string) {
  // example: 17wmkJn5wDY8o_91kYw72XLT_NdZS3u0W
  // usually an 33 characters id, and starts with 1
  return (
    id.substr(0, 1) === '1' &&
    id.length > 30 &&
    id.length < 35
  );
}

export function isDriveFileUrl(url: string) {
  return url.substr(0, DRIVE_URL.length) === DRIVE_URL;
}

export function buildDriveFileUrl(
  id: string,
  type: 'view' | 'edit' | 'uc',
) {
  return DRIVE_URL + '/' + (type === 'uc' ? `uc?id=${id}` : `file/d/${id}/${type}`);
}
export function buildDriveFileViewUrl(id: string) {
  return buildDriveFileUrl(id, 'view');
}

export function buildDriveFileEditUrl(id: string) {
  return buildDriveFileUrl(id, 'edit');
}

export function buildDriveFileUCUrl(id: string) {
  return buildDriveFileUrl(id, 'uc');
}

export function extractDriveFileId(url: string) {
  // share/edit/view (<DRIVE_URL>/file/d/<id>/...)
  // open id (<DRIVE_URL>/open?id=<id>[&...])
  // uc id (<DRIVE_URL>/uc?id=<id>[&...])
  return url
    .replace(DRIVE_URL + '/', '')
    .replace('file/d/', '')
    .split('/').shift()
    .split('id=').pop()
    .split('&').shift();
}

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

export function base64Parser(base64Value: string) {
  const [ header, body ] = base64Value.split(';base64,');
  const mimeType = header.replace('data:', '');
  if (!mimeType || !body) {
    throw new Error('Malform base64 data.');
  }
  const size = body.replace(/\=/g, '').length * 0.75; // bytes
  return { mimeType, size, base64Body: body };
}

/**
 *
 * folder
 */

export function getActiveFolder() {
  const id = SpreadsheetApp.getActiveSpreadsheet().getId();
  return DriveApp.getFileById(id).getParents().next();
}

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
  return getDriveItemInfo(folder);
}

/**
 *
 * file
 */

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
  const share = (typeof sharing === 'string') ? DRIVE_SHARING_PRESETS[sharing] : sharing;
  // create file
  return parentFolder
  .createFile(blob)
  .setSharing(
    DriveApp.Access[share.access || 'PRIVATE'],
    DriveApp.Permission[share.permission || 'NONE'],
  );
}

export function createFileFromBase64Body(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  mimeType: string,
  base64Body: string,
  sharing: DriveSharing = 'PUBLIC',
) {
  const data = Utilities.base64Decode(base64Body, Utilities.Charset.UTF_8);
  const blob = Utilities.newBlob(data, mimeType, name);
  return createFile(parentFolder, blob, sharing);
}

export function createFileFromBase64(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  base64: string,
  sharing: DriveSharing = 'PUBLIC',
) {
  const { mimeType, base64Body } = base64Parser(base64);
  return createFileFromBase64Body(parentFolder, name, mimeType, base64Body, sharing);
}

export function createFileFromString(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  mimeType: string,
  content: string,
  sharing: DriveSharing = 'PUBLIC',
) {
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
  const fileInfo = getDriveItemInfo(file);
  const mimeType = file.getMimeType();
  const url = buildDriveFileUCUrl(fileInfo.id);
  const downloadUrl = url + '&export=download';
  return {
    ... fileInfo,
    mimeType,
    url,
    downloadUrl,
  };
}

export function getFileContent(file: GoogleAppsScript.Drive.File) {
  return file.getBlob().getDataAsString();
}

export function getFileContentById(id: string) {
  return getFileContent(getFileById(id));
}
