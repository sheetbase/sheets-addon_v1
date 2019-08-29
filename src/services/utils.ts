export function isJsonString(value: string) {
  return (
    (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
    (value.substr(0, 1) === '[' && value.substr(-1) === ']')
  );
}

export function isUrl(value: string) {
  return (
    value.indexOf('http') !== -1 &&
    value.indexOf('://') !== -1
  );
}
