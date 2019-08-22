export function getProperty(key: string) {
  return PropertiesService.getDocumentProperties()
  .getProperty(key);
}

export function getProperties() {
  return PropertiesService.getDocumentProperties()
  .getProperties();
}

export function setProperty(key: string, value: any) {
  return PropertiesService.getDocumentProperties()
  .setProperty(key, value);
}

export function setProperties(
  properties: {[key: string]: any},
  deleteAllOthers = false,
) {
  return PropertiesService.getDocumentProperties()
  .setProperties(properties, deleteAllOthers);
}

export function deleteProperty(key: string) {
  return PropertiesService.getDocumentProperties()
  .deleteProperty(key);
}

export function deleteAllProperties() {
  return PropertiesService.getDocumentProperties()
  .deleteAllProperties();
}
