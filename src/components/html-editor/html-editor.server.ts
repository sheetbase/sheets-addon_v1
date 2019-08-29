import { loadContent, saveContent } from '../../services/editor';

import { EditorData, EditorSetMode } from '../../types';

export function loadHtmlContent(): EditorData {
  return loadContent('html');
}

export function saveHtmlContent(data: EditorData, setMode: EditorSetMode) {
  return saveContent(data, setMode, 'html');
}
