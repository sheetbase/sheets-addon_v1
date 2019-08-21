export function getDoc(docId: string, withStyle = false) {
  DriveApp.getStorageUsed(); // trigger drive scope
  const url = 'https://www.googleapis.com/drive/v3/files/' + docId + '/export?mimeType=text/html';
  // send request
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {Authorization: 'Bearer ' + ScriptApp.getOAuthToken()},
    muteHttpExceptions:true,
  });
  // error
  if(!response || response.getResponseCode() !== 200) return;
  // proccess content
  let content = response.getContentText();
  if(!withStyle) {
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
