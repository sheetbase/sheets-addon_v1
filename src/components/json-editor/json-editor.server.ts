import { getCache, setCache } from '../../services/cache';
import {
  getFolderById,
  getFolderByName,
  getFileById,
  getFileContentById,
  createFileJSON,
} from '../../services/drive';
import { fetchGet, fetchPost } from '../../services/fetch';
import { md5 } from '../../services/md5';
import { getSheet, setData } from '../../services/sheets';
import { getProjectInfo } from '../settings/settings.server';

import { SetMode, ParsedLoaderValue } from './json-editor.types';

function setJsonContentExternal_(
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
  // no url
  // create new content
  if (!url) {
    const responseJson = JSON.parse(response.getContentText());
    url = responseJson.url; // new content url
  }
  // return the url
  return url;
}

function setJsonContentInDrive_(
  jsonText: string,
  folderId: string,
  id?: string,
) {
  // create new file
  if (!id) {
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
    // the file
    const fileName = key + '_' + field + '.json';
    const file = createFileJSON(folder, fileName, jsonText, 'PUBLIC');
    // return the new file id
    id = file.getId();
  }
  // update the file content
  else {
    const file = getFileById(id);
    file.setContent(jsonText);
  }
  // return the url
  return ('https://drive.google.com/uc?id=' + id);
}

export function loadJsonContent(parsedLoaderValue: ParsedLoaderValue) {
  const { isExternal, value } = parsedLoaderValue;
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
  parsedLoaderValue?: ParsedLoaderValue,
) {
  // raw
  if (setMode === 'raw') {
    return setData(jsonText);
  }
  // url & jsonx
  else {
    const { isExternal, value } = parsedLoaderValue;
    const { EDITOR_HOOK, CONTENT_ID } = getProjectInfo();
    // no web hook for external resource
    if (isExternal && !EDITOR_HOOK) {
      throw new Error('No web hook for "url" mode.');
    }
    // ask for creating new file in Drive
    if (!isExternal && !value) {
      const ui = SpreadsheetApp.getUi();
      const result = ui.alert(
        'New content',
        'Create new file and save the content?',
        ui.ButtonSet.YES_NO,
      );
      // Process the user's response.
      if (result !== ui.Button.YES) return;
    }
    // set data & get the resource url
    const resourceUrl = (
      isExternal ?
      setJsonContentExternal_(jsonText, EDITOR_HOOK, value) :
      setJsonContentInDrive_(jsonText, CONTENT_ID, value)
    );
    if (!resourceUrl) {
      throw new Error('Error updating json content.');
    }
    // set active cell data
    return setData(
      (setMode === 'jsonx' ? 'json://' : '') + resourceUrl,
    );
  }
}
