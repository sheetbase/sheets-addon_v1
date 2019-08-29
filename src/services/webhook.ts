import { fetchPost } from './fetch';
import { getProperty } from './properties';

export function getWebhookUrl() {
  return getProperty('WEBHOOK_URL');
}

export function emitWebhookEvent(event: string, data: any, resourceUrl = '') {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    throw new Error('No webhook!');
  }
  // send request
  const response = fetchPost(
    webhookUrl,
    {
      contentType: 'application/json',
      payload: JSON.stringify({ event, resource: resourceUrl, data }),
    },
  );
  // return the resource url
  return resourceUrl || JSON.parse(response.getContentText())['url'] as string;
}
