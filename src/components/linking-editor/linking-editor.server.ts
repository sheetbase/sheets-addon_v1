import { getAllSheetNames } from '../../services/sheets';

export function getSources() {
  return getAllSheetNames();
}