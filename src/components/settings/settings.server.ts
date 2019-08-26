import { getCache, setCache } from '../../services/cache';
import {
  FolderInfo,
  FileInfo,
  getActiveFolder,
  getFolderByName,
  getFolderInfo,
  getFileByName,
  getFileInfo,
} from '../../services/drive';

interface ProjectInfo {
  project?: FolderInfo;
  database?: FileInfo;
  backend?: FileInfo;
  upload?: FolderInfo;
}

export function getProjectInfo() {
  const cacheKey = 'SETTINGS_PROJECT_INFO';
  // get project info
  const getInfo = (): ProjectInfo => {
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
  // get & set cache
  const data = getCache<ProjectInfo>(cacheKey);
  return data || setCache(cacheKey, getInfo(), 21600);
}