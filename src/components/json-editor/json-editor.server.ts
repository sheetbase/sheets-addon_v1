import { getCache, setCache, clearCache } from '../../services/cache';
import {
  getFolderById,
  getFolderByName,
  getFileById,
  getFileContentById,
  createFileJSON,
  buildFileUCUrl,
  extractFileIdFromUCUrl,
} from '../../services/drive';
import { fetchGet, fetchPost } from '../../services/fetch';
import { md5 } from '../../services/md5';
import { getSheet, getData, setData } from '../../services/sheets';
import { getProjectInfo } from '../settings/settings.server';

import { SetMode, SourceData, LoadResult } from './json-editor.types';

export const AUTO_LOADED_JSON_SCHEME = 'json://';

function buildCacheKey_(value: string, type: 'ID' | 'URL') {
  return 'JSONEDITOR_CONTENT_' + type + '_' + (type === 'URL' ? md5(value) : value);
}

function isJsonText_(value: string) {
  return (
    (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
    (value.substr(0, 1) === '[' && value.substr(-1) === ']')
  );
}

function isUrl_(value: string) {
  return (
    value.indexOf('http') !== -1 &&
    value.indexOf('://') !== -1
  );
}

function isDriveFileId_(value: string) {
  // example: 17wmkJn5wDY8o_91kYw72XLT_NdZS3u0W
  // usually an 33 characters id, and starts with 1
  return (
    value.substr(0, 1) === '1' &&
    value.length > 30 &&
    value.length < 35
  );
}

function isValidSource_(value: string) {
  return !!value && (
    !!isJsonText_(value) ||
    !!isUrl_(value) ||
    !!isDriveFileId_(value)
  );
}

function isSourceOnDrive_(value: string) {
  return value.indexOf('drive.google.com') !== -1;
}

export function parseJsonEditorSource(source: string): SourceData {
  const id = !!isSourceOnDrive_(source) ? extractFileIdFromUCUrl(source) : null;
  const url = !id ? source : null;
  return { id, url, isExternal: !!url };
}

export function loadJsonContent(): LoadResult {
  let value = getData();
  // invalid source value
  if (!isValidSource_(value)) {
    throw new Error(
      'Invalid source value, only supports:\n' +
      '+ A json string\n' +
      '+ An on-Drive json file ID\n' +
      '+ An url to a json content\n' +
      '+ A json://... url\n',
    );
  }
  // get result
  let result: LoadResult;
  // a stringified json
  if (!!isJsonText_(value)) {
    result = { jsonText: value };
  } else {
    // turn file id to url
    value = !isDriveFileId_(value) ? value : buildFileUCUrl(value);
    // sum-up data
    const source = value.replace(AUTO_LOADED_JSON_SCHEME, '');
    const autoLoaded = (value.substr(0, 7) === AUTO_LOADED_JSON_SCHEME);
    // load content
    const { isExternal, id, url } = parseJsonEditorSource(source);
    const cacheKey = buildCacheKey_(id || url, !!isExternal ? 'URL' : 'ID');
    const jsonText = (
      getCache<string>(cacheKey, true) ||
      setCache<string>(
        cacheKey,
        !!isExternal ? fetchGet(url).getContentText() : getFileContentById(id),
        3600,
      )
    );
    // final source
    result = { source, autoLoaded, jsonText };
  }
  return result;
}

function setContentExternal_(
  jsonText: string,
  webhookUrl: string,
  url?: string,
) {
  // send request
  const response = fetchPost(
    webhookUrl,
    {
      contentType: 'application/json',
      payload: JSON.stringify({
        event: 'jsoneditor',
        resource: url || null,
        data: JSON.parse(jsonText),
      }),
    },
  );
  // return the resource url
  return url || JSON.parse(response.getContentText())['url'];
}

function createFileOnDrive_(
  jsonText: string,
  folderId: string,
) {
  // item info
  const sheet = getSheet();
  const sheetName = sheet.getName();
  const currentCell = sheet.getActiveCell();
  const key = sheet.getRange(currentCell.getRow(), 3).getValue();
  const field = sheet.getRange(1, currentCell.getColumn()).getValue();
  // parent folder
  const folder = getFolderByName(
    sheetName.charAt(0).toUpperCase() + sheetName.slice(1), // folder by content type
    getFolderById(folderId),
  );
  // save the file
  const fileName = key + '_' + field + '.json';
  const file = createFileJSON(folder, fileName, jsonText, 'PUBLIC');
  // return the resource url
  return buildFileUCUrl(file.getId());
}

export function saveJsonContent(
  jsonText: string,
  source: string,
  setMode: SetMode,
  autoLoaded?: boolean,
) {
  // set json string
  // RAW
  if (setMode === 'RAW') {
    return setData(jsonText);
  }
  // other modes
  // save content and set data by mode
  // retrieve the resource url
  let resourceUrl: string;
  const { EDITOR_HOOK, CONTENT_ID } = getProjectInfo();
  // new file on Drive
  // NEW_INTERNAL
  if (setMode === 'NEW_INTERNAL') {
    resourceUrl = createFileOnDrive_(jsonText, CONTENT_ID);
  }
  // new file externaly
  // NEW_EXTERNAL
  else if (setMode === 'NEW_EXTERNAL') {
    resourceUrl = setContentExternal_(jsonText, EDITOR_HOOK);
  }
  // update current
  // CURRENT
  else {
    const { isExternal, id, url } = parseJsonEditorSource(source);
    // no web hook for external resource
    if (!!isExternal && !EDITOR_HOOK) {
      throw new Error('No web hook for update date externaly.');
    }
    // update file externally
    if (!!isExternal && !!EDITOR_HOOK) {
      resourceUrl = setContentExternal_(jsonText, EDITOR_HOOK, url);
      // clear cache
      clearCache(buildCacheKey_(resourceUrl, 'URL'));
    }
    // update file on Drive
    else if (!isExternal) {
      getFileById(id).setContent(jsonText); // update content
      resourceUrl = buildFileUCUrl(id);
      // clear cache
      clearCache(buildCacheKey_(id, 'ID'));
    }
  }
  // set data to active cell
  setData((!!autoLoaded ? AUTO_LOADED_JSON_SCHEME : '') + resourceUrl);
  // return to the client the resource url
  return resourceUrl;
}
