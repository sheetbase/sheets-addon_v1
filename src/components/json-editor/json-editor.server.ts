import { loadContent, saveContent } from '../../services/editor';

import { EditorData, EditorSetMode } from '../../types';

export function loadJsonContent(): EditorData {
  return loadContent('json');
}

export function saveJsonContent(setMode: EditorSetMode, data: EditorData) {
  return saveContent('json', setMode, data);
}
