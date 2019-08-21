interface DriveItemInfo {
  id: string;
  name: string;
  description: string;
  created: Date;
  updated: Date;
  link: string;
  size: number;
  sharing: DriveSharing;
}

interface FolderInfo extends DriveItemInfo {}
interface FileInfo extends DriveItemInfo {
  mimeType: string;
  url: string;
  downloadUrl: string;
}

type FileSharing = SharingPreset | DriveSharing;
type SharingPreset = 'PUBLIC' | 'PRIVATE';
interface DriveSharing {
  access?: GoogleAppsScript.Drive.Access;
  permission?: GoogleAppsScript.Drive.Permission;
}

const SHARING_PRESETS: {[preset: string]: DriveSharing} = {
  PUBLIC: {
    access: DriveApp.Access.ANYONE_WITH_LINK,
    permission: DriveApp.Permission.VIEW,
  },
  PRIVATE: {
    access: DriveApp.Access.PRIVATE,
    permission: DriveApp.Permission.NONE,
  },
};

export function getDriveItemInfo(
  item: GoogleAppsScript.Drive.File | GoogleAppsScript.Drive.Folder,
): DriveItemInfo {
  const id = item.getId();
  const name = item.getName();
  const description = item.getDescription();
  const created = item.getDateCreated();
  const updated = item.getLastUpdated();
  const link = item.getUrl();
  const size = item.getSize();
  const access = item.getSharingAccess();
  const permission = item.getSharingPermission();
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

export function getProjectFolder() {
  const activeSpreadsheetId = SpreadsheetApp
  .getActiveSpreadsheet()
  .getId();
  return DriveApp
  .getFileById(activeSpreadsheetId)
  .getParents()
  .next();
}

export function getProjectFolderInfo(): FolderInfo {
  return getDriveItemInfo(
    getProjectFolder(),
  );
}

export function getProjectFolderInfoAsString() {
  return JSON.stringify(getProjectFolderInfo());
}

export function getFolder(
  // a folder -> return immediately
  // or name
  // or path
  folder: string | GoogleAppsScript.Drive.Folder,
  // use the project folder if not provided
  parentFolder?: GoogleAppsScript.Drive.Folder,
) {
  let finalFolder: GoogleAppsScript.Drive.Folder;
  if (typeof folder === 'string') {
    const folderNames = folder.split('/').map(x => x.trim());
    // create folders
    finalFolder = parentFolder || getProjectFolder();
    for (let i = 0; i < folderNames.length; i++) {
      const folderName = folderNames[i];
      // get all children
      // and return the first
      // or create new one
      const childFolders = finalFolder.getFoldersByName(folderName);
      if(!childFolders.hasNext()) {
        finalFolder = finalFolder.createFolder(folderName);
      } else {
        finalFolder = childFolders.next();
      }
    }
  } else {
    finalFolder = folder; // return immediately
  }
  return finalFolder;
}

export function getFolderInfo(
  folder: string | GoogleAppsScript.Drive.Folder,
): FolderInfo {
  return getDriveItemInfo(
    getFolder(folder),
  );
}

export function getFolderInfoAsString(
  folder: string | GoogleAppsScript.Drive.Folder,
) {
  return JSON.stringify(getFolderInfo(folder));
}

export function getFileByName(
  folder: string | GoogleAppsScript.Drive.Folder,
  name: string,
) {
  const childFiles = getFolder(folder).getFilesByName(name);
  return !!childFiles.hasNext() ? childFiles.next() : null;
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

export function getFileInfoAsString(file: GoogleAppsScript.Drive.File) {
  return JSON.stringify(getFileInfo(file));
}

function setFileSharing(
  file: GoogleAppsScript.Drive.File,
  sharing: FileSharing,
) {
  const { access, permission } = (typeof sharing === 'string') ?
    SHARING_PRESETS[sharing] : sharing;
  return file.setSharing(
    access || DriveApp.Access.PRIVATE,
    permission || DriveApp.Permission.NONE,
  );
}

export function createFile(
  folder: string | GoogleAppsScript.Drive.Folder,
  blob: GoogleAppsScript.Base.Blob,
  sharing: FileSharing = 'PUBLIC',
) {
  // create file
  const file = getFolder(folder).createFile(blob);
  // set sharing
  setFileSharing(file, sharing);
  // result
  return file;
}

export function createFileFromString(
  folder: string | GoogleAppsScript.Drive.Folder,
  name: string,
  mimeType: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  // create file
  const blob = Utilities.newBlob(content, mimeType, name);
  return createFile(folder, blob, sharing);
}

export function createFileText(
  folder: string | GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  return createFileFromString(folder, name, 'text/plain', content, sharing);
}

export function createFileJSON(
  folder: string | GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  return createFileFromString(folder, name, 'application/json', content, sharing);
}

export function createFileHTML(
  folder: string | GoogleAppsScript.Drive.Folder,
  name: string,
  content: string,
  sharing: FileSharing = 'PUBLIC',
) {
  return createFileFromString(folder, name, 'text/html', content, sharing);
}
