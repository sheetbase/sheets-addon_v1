import { buildCacheKey, getCache, setCache, clearCache } from './cache';
import {
  isDriveFileId,
  isDriveFileUrl,
  extractDriveFileId,
  buildDriveFileViewUrl,
  buildDriveFileUCUrl,
  getFileById,
  getFileContentById,
  createFileFromString,
  getFolderById,
  getFolderByName,
} from './drive';
import { fetchGet } from './fetch';
import { getProperty } from './properties';
import { getSheet, getData, setData } from './sheets';
import { isUrl } from './utils';
import { emitWebhookEvent } from './webhook';

import {
  EditorType,
  EditorConfig,
  EditorSetMode,
  EditorData,
} from '../types';

export const AUTO_LOADED_JSON_SCHEME = 'json://';
export const AUTO_LOADED_CONTENT_SCHEME = 'content://';
export const EDITOR_CONFIGS = {
  // json editor
  json: {
    autoloadedScheme: AUTO_LOADED_JSON_SCHEME,
    webhookEvent: 'jsoneditor',
    mimeType: 'application/json',
    fileExt: 'json',
    cachePrefix: 'JSON_CONTENT',
    invalidSourceHandler: value => JSON.stringify(!!value ? { value } : {}),
  },
  // html editor
  html: {
    autoloadedScheme: AUTO_LOADED_CONTENT_SCHEME,
    webhookEvent: 'htmleditor',
    mimeType: 'text/html',
    fileExt: 'html',
    cachePrefix: 'HTML_CONTENT',
    invalidSourceHandler: value => '',
  },
} as {
  [editor: string]: EditorConfig;
};

export function loadContent(editor: EditorType): EditorData {
  const { // load config
    autoloadedScheme,
    cachePrefix,
    invalidSourceHandler,
  } = EDITOR_CONFIGS[editor];
  let value = getData(); // get current data
  const autoLoaded = ( // save auto-loaded status
    (value || '').substr(0, autoloadedScheme.length) === autoloadedScheme
  );
  // no value
  // or a normal string (not a valid hosted source)
  if (!value || !(isDriveFileId(value) || isUrl(value) || !!autoLoaded)) {
    return { content: invalidSourceHandler(value) };
  } else {
    // remove auto-loaded scheme
    value = value.replace(autoloadedScheme, '');
    // save source
    // or extract value from drive url
    const source = isDriveFileUrl(value) ? extractDriveFileId(value) : value;
    let sourceUrl = source;
    let viewUrl = source;
    let onDrive = false;
    if (isDriveFileId(source)) {
      sourceUrl = buildDriveFileUCUrl(source);
      viewUrl = buildDriveFileViewUrl(source);
      onDrive = true;
    }
    // load content
    const cacheKey = buildCacheKey(source, cachePrefix);
    const getContent = () => (
      !!onDrive ?
      getFileContentById(source) :
      fetchGet(source).getContentText()
    );
    const content = (
      getCache<string>(cacheKey, true) ||
      setCache<string>(cacheKey, getContent(), 3600)
    );
    // final result
    return {
      source,
      content,
      autoLoaded,
      sourceUrl,
      viewUrl,
      onDrive,
    };
  }
}

export function saveContent(
  data: EditorData,
  setMode: EditorSetMode,
  editor: EditorType,
) {
  const { content, autoLoaded, onDrive } = data;
  let { source, sourceUrl, viewUrl } = data;
  const {
    autoloadedScheme,
    webhookEvent,
    mimeType,
    fileExt,
    cachePrefix,
  } = EDITOR_CONFIGS[editor];
  // RAW
  if (setMode === 'RAW') {
    return setData(content);
  }
  // save content and set data by mode
  // NEW_INTERNAL
  if (setMode === 'NEW_INTERNAL') {
    const contentFolderId = getProperty('CONTENT_ID');
    // load current cell associated info
    const sheet = getSheet();
    const sheetName = sheet.getName();
    const currentCell = sheet.getActiveCell();
    const key = sheet.getRange(currentCell.getRow(), 3).getValue();
    const field = sheet.getRange(1, currentCell.getColumn()).getValue();
    // parent folder
    const folder = getFolderByName(
      sheetName.charAt(0).toUpperCase() + sheetName.slice(1), // folder by content type
      getFolderById(contentFolderId),
    );
    // save the file
    const fileName = key + '_' + field + '.' + fileExt;
    const file = createFileFromString(folder, fileName, mimeType, content, 'PUBLIC');
    // return the resource url
    source = file.getId();
    sourceUrl = buildDriveFileUCUrl(source);
    viewUrl = buildDriveFileViewUrl(source);
  }
  // NEW_EXTERNAL
  else if (setMode === 'NEW_EXTERNAL') {
    source = emitWebhookEvent(webhookEvent, content);
    sourceUrl = source;
    viewUrl = source;
  }
  // CURRENT
  else {
    if (!onDrive) { // update file on Drive
      getFileById(source).setContent(content);
    } else { // update file externally
      emitWebhookEvent(webhookEvent, content, source);
    }
    // clear cache
    clearCache(
      buildCacheKey(source, cachePrefix),
    );
  }
  // set data to active cell
  setData(
    (!!autoLoaded ? autoloadedScheme : '') +
    ((!autoLoaded && !!onDrive) ? sourceUrl : source),
  );
  // return to the client the data
  return { source, sourceUrl, viewUrl } as EditorData;
}
