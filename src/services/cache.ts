// https://developers.google.com/apps-script/reference/cache/cache

export function getCache<Data>(key: string, raw = false) {
  let result: any = CacheService.getDocumentCache().get(key) as string;
  // try to parse the json data
  if (!raw) {
    try {
      result = JSON.parse(result);
    } catch (e) {
      // not json or malform
    }
  }
  // final result
  return result as Data;
}

export function setCache<Data>(
  key: string,
  data: Data,
  cacheTime = 60, // in seconds
) {
  const dataStr = (typeof data === 'string') ? data : JSON.stringify(data);
  CacheService.getDocumentCache().put(key, dataStr, cacheTime);
  // return original data
  return data;
}
