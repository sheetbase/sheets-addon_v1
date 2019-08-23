import {
  getActiveFolder,
  getFolderByName,
  getFolderInfo,
  getFileByName,
  getFileInfo,
} from '../../services/drive';

export function getProjectInfo() {
  const projectFolder = getActiveFolder();
  // project
  const project = getFolderInfo(projectFolder);
  project.name = project.name.replace('Sheetbase: ', '');
  // database
  const database = getFileInfo(
    getFileByName(projectFolder, project.name + ' Database'),
  );
  // backend
  const backend = getFileInfo(
    getFileByName(projectFolder, project.name + ' Backend'),
  );
  // upload
  const upload = getFolderInfo(
    getFolderByName(project.name + ' Upload', projectFolder),
  );
  // result
  return { project, database, backend, upload };
}