import { getActiveFolder, getFolderByName, getFileByName } from '../../services/drive';
import { getProperties, setProperties } from '../../services/properties';

import { ProjectBuiltinInfo, ProjectCustomInfo, ProjectInfo } from '../../types';

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
  return setProperties({
    PROJECT_ID: projectId,
    PROJECT_NAME: projectName,
    DATABASE_ID: database.getId(),
    BACKEND_ID: backend.getId(),
    UPLOAD_ID: upload.getId(),
    CONTENT_ID: content.getId(),
    STORAGE_ID: storage.getId(),
  } as ProjectBuiltinInfo);
}

export function setProjectCustomInfo(info: ProjectCustomInfo) {
  return setProperties(info);
}

export function getProjectInfo(fresh = false) {
  let properties: ProjectInfo = getProperties();
  // get built-in info, when fresh or not exist
  if (!!fresh || !properties.PROJECT_ID) {
    const builtinInfo = setProjectBuiltinInfo();
    properties = { ... properties, ... builtinInfo };
  }
  // all info
  return properties;
}
