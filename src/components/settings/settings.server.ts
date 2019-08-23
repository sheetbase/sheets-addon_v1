import { getCacheRefresh } from '../../services/cache';
import {
  getActiveFolder,
  getFolderByName,
  getFolderInfo,
  getFileByName,
  getFileInfo,
} from '../../services/drive';

export function getProjectInfo() {
  const getInfo = () => {
    const projectFolder = getActiveFolder();
    // info
    const project = getFolderInfo(projectFolder);
    project.name = project.name.replace('Sheetbase: ', '');
    const database = getFileInfo(
      getFileByName(projectFolder, project.name + ' Database'),
    );
    const backend = getFileInfo(
      getFileByName(projectFolder, project.name + ' Backend'),
    );
    const upload = getFolderInfo(
      getFolderByName(project.name + ' Upload', projectFolder),
    );
    return { project, database, backend, upload };
  };
  return getCacheRefresh('SETTINGS_PROJECT_INFO', getInfo, 21600);
}