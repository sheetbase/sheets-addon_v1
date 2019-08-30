import { getSettings, setSettings } from '../../services/project';

import { ProjectSettings } from '../../types';

export function getProjectSettings(fresh = false) {
  return getSettings(fresh);
}

export function setProjectSettings(settings: ProjectSettings) {
  return setSettings(settings);
}
