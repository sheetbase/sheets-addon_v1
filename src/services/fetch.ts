type FetchMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export function fetch(
  method: FetchMethod,
  url: string,
  options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {},
) {
  const response = UrlFetchApp.fetch(url, { ... options, method });
  // error
  if(!response || response.getResponseCode() !== 200) {
    throw new Error('Fetch failed!');
  }
  return response;
}

export function fetchGet(
  url: string,
  options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {},
) {
  return fetch('get', url, options);
}

export function fetchPost(
  url: string,
  options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {},
) {
  return fetch('post', url, options);
}