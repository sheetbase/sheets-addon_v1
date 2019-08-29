import { md5 } from './md5';
import { isUrl } from './utils';

// https://developers.google.com/apps-script/reference/cache/cache

export function buildCacheKey(value: string, prefix = 'CACHED') {
  return prefix + '_' + (!!isUrl(value) ? md5(value) : value);
}

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

export function setCache<Data>(key: string, data: Data, /* seconds */ cacheTime = 60) {
  CacheService.getDocumentCache()
  .put(key, (typeof data === 'string') ? data : JSON.stringify(data), cacheTime);
  return data; // return original data
}

export function clearCache(key: string) {
  return CacheService.getDocumentCache().remove(key);
}

export function clearCacheAll(keys: string[]) {
  return CacheService.getDocumentCache().removeAll(keys);
}