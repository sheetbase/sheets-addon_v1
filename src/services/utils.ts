export function isJsonString(value: string) {
  // possibly a json string
  return (
    (value.substr(0, 1) === '{' && value.substr(-1) === '}') ||
    (value.substr(0, 1) === '[' && value.substr(-1) === ']')
  );
}

export function isUrl(value: string) {
  // possibly a url
  return (
    value.substr(0, 7) === 'http://' ||
    value.substr(0, 8) === 'https://'
  );
}
