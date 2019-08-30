import { buildDriveFileUCUrl, createFile } from '../../services/drive';
import { getDocsContent } from '../../services/docs';
import { loadContent, saveContent } from '../../services/editor';
import { getStorageFolderChild } from '../../services/project';

import { EditorData, EditorSetMode } from '../../types';

export function loadDocContent(id: string, style = false) {
  return getDocsContent(id, !style);
}

export function loadHtmlContent(): EditorData {
  return loadContent('html');
}

export function saveHtmlContent(setMode: EditorSetMode, data: EditorData) {
  return saveContent('html', setMode, data);
}

export function uploadEditorFile(blob: GoogleAppsScript.Base.Blob) {
  const folder = getStorageFolderChild(blob.getContentType());
  const file = createFile(folder, blob, 'PUBLIC');
  return buildDriveFileUCUrl(file.getId());
}
