import { getCache, setCache } from '../../services/cache';
import {
  getActiveFolder,
  getFolderByPath,
  getFileById,
  getFileContentById,
  createFileJSON,
} from '../../services/drive';
import { fetchGet, fetchPost } from '../../services/fetch';
import { md5 } from '../../services/md5';
import { setData } from '../../services/sheets';
import { getProperty } from '../../services/properties';

type SetMode = 'raw' | 'url' | 'jsonx';

function parseLoaderValue_(loaderValue: string) {
  const url: string = (loaderValue || '').replace('json://', '');
  const id: string = (
    url.indexOf('drive.google.com') !== -1 ?
    url.split('uc?id=').pop() : null
  );
  return { isExternal: (!!url && !id), value: id || url };
}

function setJsonContentExternal_(
  jsonText: string,
  url?: string,
) {
  const webHookUrl = getProperty('SETTING_EDITOR_HOOK');
  // no hook
  // error for this mode
  if (!webHookUrl) {
    throw new Error('No web hook for "url" mode.');
  }
  // has hook, no url
  // create new content
  else if (!!webHookUrl && !url) {
    let response: any = fetchPost(
      webHookUrl,
      {
        contentType: 'application/json',
        payload: JSON.stringify({
          url: null,
          service: 'jsoneditor',
          data: JSON.parse(jsonText),
        }),
      },
    );
    response = JSON.parse(response);
    // return the url to the resource
    url = response.url;
  }
  // has hook, has url
  // update content
  else if (!!webHookUrl && !!url) {
    fetchPost(
      webHookUrl,
      {
        contentType: 'application/json',
        payload: JSON.stringify({
          url,
          service: 'jsoneditor',
          data: JSON.parse(jsonText),
        }),
      },
    );
  }
  // return the url
  return url;
}

function setJsonContentInDrive_(
  jsonText: string,
  id?: string,
) {
  // no id
  // create new file
  if (!id) {
    // TODO: item info
    // parent folder
    const projectFolder = getActiveFolder();
    const projectName = projectFolder.getName().replace('Sheetbase: ', '');
    const folder = getFolderByPath(projectName + ' Content/JSON', projectFolder);
    // the file
    const name = 'file.json';
    const file = createFileJSON(folder, name, jsonText, 'PUBLIC');
    // return the new file id
    id = file.getId();
  }
  // has id
  // update the content
  else {
    const file = getFileById(id);
    file.setContent(jsonText);
  }
  // return the url
  return ('https://drive.google.com/uc?id=' + id);
}

export function loadJsonContent(loaderValue: string) {
  const { isExternal, value } = parseLoaderValue_(loaderValue);
  const _loadJsonContent = () => (
    isExternal ?
    fetchGet(value).getContentText() :
    getFileContentById(value)
  );
  const cacheKey = (
    isExternal ?
    ('JSONEDITOR_CONTENT_URL_' + md5(value)) :
    ('JSONEDITOR_CONTENT_ID_' + value)
  );
  return (
    getCache<string>(cacheKey, true) ||
    setCache<string>(cacheKey, _loadJsonContent(), 3600)
  );
}

export function setJsonContent(
  jsonText: string,
  setMode: SetMode,
  loaderValue?: string,
) {
  // raw
  if (setMode === 'raw') {
    return setData(jsonText);
  }
  // url & jsonx
  else {
    const { isExternal, value } = parseLoaderValue_(loaderValue);
    // set data, return the resource url
    const url = isExternal ?
      setJsonContentExternal_(jsonText, value) :
      setJsonContentInDrive_(jsonText, value);
    // set active cell data
    return setData(
      (setMode === 'jsonx' ? 'json://' : '') + url,
    );
  }
}