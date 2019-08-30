import { fetchPost } from './fetch';
import { getSettingWebhookUrl } from './project';

export function emitWebhookEvent(event: string, data: any, resourceUrl = '') {
  const webhookUrl = getSettingWebhookUrl();
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
