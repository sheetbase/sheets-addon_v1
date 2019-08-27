import { getActiveFolder, getFolderByName, getFileByName } from '../../services/drive';
import { getProperties, setProperties } from '../../services/properties';

import { ProjectBuiltinInfo, ProjectInfo } from './settings.types';

export function setProjectBuiltinInfo() {
  const projectFolder = getActiveFolder();
  const projectId = projectFolder.getId();
  const projectName = projectFolder.getName().replace('Sheetbase: ', '');
  const database = getFileByName(projectFolder, projectName + ' Database');
  const backend = getFileByName(projectFolder, projectName + ' Backend');
  const upload = getFolderByName(projectName + ' Upload', projectFolder);
  const content = getFolderByName(projectName + ' Content', projectFolder);
  const storage = getFolderByName(projectName + ' Storage', projectFolder);
  // set all properties
  return setProperties<ProjectBuiltinInfo>({
    PROJECT_ID: projectId,
    PROJECT_NAME: projectName,
    DATABASE_ID: database.getId(),
    BACKEND_ID: backend.getId(),
    UPLOAD_ID: upload.getId(),
    CONTENT_ID: content.getId(),
    STORAGE_ID: storage.getId(),
  });
}

export function getProjectInfo(fresh = false) {
  // all or just custom
  let properties: ProjectInfo = getProperties();
  // get built-in info, when fresh or not exist
  if (!!fresh || !properties.PROJECT_ID) {
    properties = { ... getProperties(), ... setProjectBuiltinInfo() };
  }
  // all info
  return properties;
}
