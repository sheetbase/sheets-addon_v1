import { buildDriveFileUCUrl, createFileFromBase64Body } from '../../services/drive';
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

export function uploadEditorFile(base64Body: string, mimeType: string, name: string) {
  const folder = getStorageFolderChild(mimeType);
  const file = createFileFromBase64Body(folder, name, mimeType, base64Body);
  return buildDriveFileUCUrl(file.getId());
}
