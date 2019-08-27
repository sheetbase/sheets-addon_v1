// https://developers.google.com/apps-script/reference/properties/properties

export function getProperty(key: string) {
  return PropertiesService.getDocumentProperties().getProperty(key);
}

export function getProperties<Data>() {
  return PropertiesService.getDocumentProperties().getProperties() as Data;
}

export function setProperty(key: string, value: any) {
  return PropertiesService.getDocumentProperties().setProperty(key, value);
}

export function setProperties<Data>(
  properties: Data,
  deleteAllOthers = false,
) {
  PropertiesService.getDocumentProperties().setProperties(properties, deleteAllOthers);
  return properties;
}

export function deleteProperty(key: string) {
  return PropertiesService.getDocumentProperties().deleteProperty(key);
}

export function deleteAllProperties() {
  return PropertiesService.getDocumentProperties().deleteAllProperties();
}
