import { getFileContentById } from '../../services/drive';
import { fetchGet } from '../../services/fetch';

// TODO: add caching
// TODO: support web hook for saving external data

export function loadJsonContentByFileId(id: string) {
  return getFileContentById(id);
}

export function loadJsonContentByUrl(url: string) {
  return fetchGet(url).getContentText();
}