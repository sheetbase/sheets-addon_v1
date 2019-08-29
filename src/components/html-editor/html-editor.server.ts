import { getDocsContent } from '../../services/docs';
import { loadContent, saveContent } from '../../services/editor';

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
