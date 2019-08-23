// https://developers.google.com/apps-script/reference/cache/cache

export function getCacheRefresh<Data>(
  key: string,
  refresher: () => Data,
  cacheTime = 60, // in seconds
): Data {
  const cache = CacheService.getDocumentCache();
  // get data in cache
  let result: any = cache.get(key);
  // has cached data
  if (!!result) {
    try {
      result = JSON.parse(result);
    } catch (e) {
      // not json or malform
    }
  }
  // no cached
  else {
    result = refresher();
    // stringify
    result = (typeof result === 'string') ? result : JSON.stringify(result);
    // save to cache
    cache.put(key, result, cacheTime);
  }
  // final result
  return result as Data;
}