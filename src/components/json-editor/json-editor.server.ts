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

export function loadJsonContentByFileId(id: string) {
  const cacheKey = 'JSONEDITOR_CONTENT_ID_' + id;
  // get & set cache
  const data = getCache<string>(cacheKey, true);
  return data || setCache(cacheKey, getFileContentById(id), 21600);
}

export function loadJsonContentByUrl(url: string) {
  const cacheKey = 'JSONEDITOR_CONTENT_URL_' + md5(url);
  const data = getCache<string>(cacheKey, true);
  return data || setCache(cacheKey, fetchGet(url).getContentText(), 21600);
}

function setJsonContentByUrl(
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
    const response = JSON.parse(
      fetchPost(webHookUrl, {
        contentType: 'application/json',
        payload: JSON.stringify({ data: jsonText }),
      })
      .getContentText(),
    );
    url = response.url;
  }
  // has hook, has url
  // update content
  else if (!!webHookUrl && !!url) {
    fetchPost(webHookUrl, {
      contentType: 'application/json',
      payload: JSON.stringify({ url, data: jsonText }),
    });
  }
  // return the url
  return url;
}

function setJsonContentById(
  jsonText: string,
  id?: string,
) {
  // no id
  // create new file
  if (!id) {
    const projectFolder = getActiveFolder();
    const projectName = projectFolder.getName().replace('Sheetbase: ', '');
    const folder = getFolderByPath(projectName + ' Content/JSON', projectFolder);
    // the file
    const file = createFileJSON(
      folder,
      'file.json',
      jsonText,
      'PUBLIC',
    );
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

export function setJsonContent(
  jsonText: string,
  mode: SetMode,
  url?: string,
  id?: string,
) {
  // mode raw
  if (mode === 'raw') {
    return setData(jsonText);
  }
  // mode url & jsonx
  if (
    // no loader input => default to in-Drive
    (!id && !url) ||
    // in-Drive
    !!id
  ) {
    url = setJsonContentById(jsonText, id);
  } else if (!!url) { // external url
    url = setJsonContentByUrl(jsonText, url);
  }
  // set active cell data
  return setData((mode === 'url' ? '' : 'json://') + url);
}