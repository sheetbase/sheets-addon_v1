import { loadContent, saveContent } from '../../services/editor';

import { EditorData, EditorSetMode } from '../../types';

export function loadJsonContent(): EditorData {
  return loadContent('json');
}

export function saveJsonContent(data: EditorData, setMode: EditorSetMode) {
  return saveContent(data, setMode, 'json');
}
