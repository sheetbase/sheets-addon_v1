import {
  getActiveFolder,
  getFolderByName,
  getFolderInfo,
  getFileByName,
  getFileInfo,
} from '../../services/drive';

export function getProjectInfo() {
  const projectFolder = getActiveFolder();
  // info
  const project = getFolderInfo(projectFolder);
  const database = getFileInfo(
    getFileByName(projectFolder, project.name + ' Database'),
  );
  const backend = getFileInfo(
    getFileByName(projectFolder, project.name + ' Backend'),
  );
  const upload = getFolderInfo(
    getFolderByName(project.name + ' Upload', projectFolder),
  );
  // result
  return { project, database, backend, upload };
}