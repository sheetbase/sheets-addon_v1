interface DriveItemInfo {
  id: string;
  name: string;
  description: string;
  created: string;
  updated: string;
  link: string;
  size: number;
  sharing: DriveSharing;
}

type FileSharing = SharingPreset | DriveSharing;
type SharingPreset = 'PUBLIC' | 'PRIVATE';
interface DriveSharing {
  access?: string;
  permission?: string;
}

export interface FolderInfo extends DriveItemInfo {}
export interface FileInfo extends DriveItemInfo {
  mimeType: string;
  url: string;
  downloadUrl: string;
}

/**
 *
 * static
 */

const SHARING_PRESETS: { [preset: string]: DriveSharing } = {
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

export function getActiveFolderInfo(): FolderInfo {
  return getDriveItemInfo(getActiveFolder());
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

export function getFolderInfo(folder: GoogleAppsScript.Drive.Folder): FolderInfo {
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
  sharing: FileSharing = 'PUBLIC',
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
  sharing: FileSharing = 'PUBLIC',
) {
  // create file
  const blob = Utilities.newBlob(content, mimeType, name);
  return createFile(parentFolder, blob, sharing);
}

export function createFileText(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  return createFileFromString(parentFolder, name, 'text/plain', content, sharing);
}

export function createFileJSON(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  return createFileFromString(parentFolder, name, 'application/json', content, sharing);
}

export function createFileHTML(
  parentFolder: GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  return createFileFromString(parentFolder, name, 'text/html', content, sharing);
}

export function getFileInfo(file: GoogleAppsScript.Drive.File): FileInfo {
  const fileInfo = getDriveItemInfo(file);
  const mimeType = file.getMimeType();
  const url = 'https://drive.google.com/uc?id=' + fileInfo.id;
  const downloadUrl = url + '&export=download';
  return {
    ... fileInfo,
    mimeType,
    url,
    downloadUrl,
  };
}
