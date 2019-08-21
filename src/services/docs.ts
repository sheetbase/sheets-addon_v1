import { fetchGet } from './fetch';

export function getDoc(docId: string, clean = true) {
  // send request
  const response = fetchGet(
    'https://www.googleapis.com/drive/v3/files/' + docId + '/export?mimeType=text/html',
    {
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      },
      muteHttpExceptions:true,
    },
  );
  // proccess content
  let content = response.getContentText();
  if(!!clean) {
    // remove attrs
    ['style', 'id', 'class', 'width', 'height'].map(attr => {
      content = content.replace(new RegExp('(\ ' + attr + '\=\".*?\")', 'g'), '');
    });
    // get the content between <body> and </body>
    content = content.substring(
      content.lastIndexOf('<body>') + 6,
      content.lastIndexOf('</body>'),
    );
  }
  return content;
}
