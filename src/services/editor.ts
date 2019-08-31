import {
  isDriveFileId,
  isDriveFileUrl,
  extractDriveFileId,
  buildDriveFileViewUrl,
  buildDriveFileUCUrl,
  getFileById,
  getFileContentById,
  createFileFromString,
} from './drive';
import { fetchGet } from './fetch';
import { getContentFolderChild } from './project';
import { getSheet, getData, setData } from './sheets';
import { isUrl, isJsonString } from './utils';
import { emitWebhookEvent } from './webhook';

import {
  EditorType,
  EditorConfig,
  EditorSetMode,
  EditorData,
} from '../types';

export const AUTO_LOADED_JSON_SCHEME = 'json://';
export const AUTO_LOADED_TEXT_SCHEME = 'content://';
export const EDITOR_CONFIGS = {
  // json editor
  json: {
    autoloadedScheme: AUTO_LOADED_JSON_SCHEME,
    webhookEvent: 'jsoneditor',
    mimeType: 'application/json',
    fileExt: 'json',
    valueHandler: value => (
      !value ? '{}' : (isJsonString(value) ? value : JSON.stringify({ value }))
    ),
  },
  // html editor
  html: {
    autoloadedScheme: AUTO_LOADED_TEXT_SCHEME,
    webhookEvent: 'htmleditor',
    mimeType: 'text/html',
    fileExt: 'html',
    valueHandler: value => (value || ''),
  },
} as {
  [editor: string]: EditorConfig;
};

export function loadContent(editor: EditorType): EditorData {
  const { autoloadedScheme, valueHandler } = EDITOR_CONFIGS[editor]; // load config
  let value = getData(); // get current data
  const autoLoaded = ( // save auto-loaded status
    (value || '').substr(0, autoloadedScheme.length) === autoloadedScheme
  );
  // no value
  // or a normal string (not a valid hosted source)
  if (!value || !(isDriveFileId(value) || isUrl(value) || !!autoLoaded)) {
    return { content: valueHandler(value) };
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
    const content = !!onDrive ? getFileContentById(source) : fetchGet(source).getContentText();
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
  editor: EditorType,
  setMode: EditorSetMode,
  data: EditorData,
) {
  // RAW
  if (setMode === 'RAW') {
    return setData(data.content);
  } else {
    // inputs
    const { content, autoLoaded } = data; // unchangable
    let { source, sourceUrl, viewUrl, onDrive } = data; // changable
    // configs
    const {
      autoloadedScheme,
      webhookEvent,
      mimeType,
      fileExt,
    } = EDITOR_CONFIGS[editor];
    // save content and set data by mode
    // NEW_INTERNAL
    if (setMode === 'NEW_INTERNAL') {
      // load current cell associated info
      const sheet = getSheet();
      const activeCell = sheet.getActiveCell();
      const key = sheet.getRange(activeCell.getRow(), 3).getValue();
      const field = sheet.getRange(1, activeCell.getColumn()).getValue();
      // parent folder
      const folder = getContentFolderChild(sheet.getName());
      // save the file
      const fileName = key + '--' + field + '.' + fileExt;
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
      if (!!onDrive) { // update file on Drive
        getFileById(source).setContent(content);
      } else { // update file externally
        emitWebhookEvent(webhookEvent, content, source);
      }
    }
    // re-evaluate values
    onDrive = isDriveFileId(source);
    // set data to active cell
    // compare with current value
    const currentValue = getData();
    const updateValue = (
      (!!autoLoaded ? autoloadedScheme : '') +
      ((!autoLoaded && !!onDrive) ? sourceUrl : source)
    );
    // only set when no current value
    // or the update value is different from the current one
    if (!currentValue || currentValue !== updateValue) {
      setData(
        (!!autoLoaded && !!onDrive) ?
        `=HYPERLINK("${ viewUrl }", "${ updateValue }")` :
        updateValue,
      );
    }
    // return to the client the data
    return { source, sourceUrl, viewUrl, autoLoaded, onDrive } as EditorData;
  }
}
