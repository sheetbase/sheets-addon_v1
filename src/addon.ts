function displayError(message: string, title = 'Oops, something wrong!') {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, message, ui.ButtonSet.OK);
}

function getData(
  spreadsheetId?: string,
  rangeA1?: string,
  noHeaders = false,
  raw = true,
) {
  const spreadsheet = !!spreadsheetId ?
    SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  const range = !!rangeA1 ?
    spreadsheet.getRange(rangeA1) : SpreadsheetApp.getActiveRange();
  const data = (range.getWidth() <= 1 && range.getHeight() <= 1) ?
    range.getValue() : range.getValues();
  return !!raw ? data : transformValue(data, noHeaders);
}

function setData(
  data: any,
  spreadsheetId?: string,
  rangeA1?: string, // set: Sheet1!A:A | append: Sheet1
  isAppended = false,
) {
  if(!data) return displayError('No data to save!');
  // spreadsheet
  const spreadsheet = !!spreadsheetId ?
    SpreadsheetApp.openById(spreadsheetId) : SpreadsheetApp.getActiveSpreadsheet();
  // sheet & range
  let sheet: GoogleAppsScript.Spreadsheet.Sheet;
  let range: GoogleAppsScript.Spreadsheet.Range;
  if(!!isAppended) {
    sheet = !!rangeA1 ? spreadsheet.getSheetByName(rangeA1) : SpreadsheetApp.getActiveSheet();
    // append data to the last row
    const lastRow = sheet.getLastRow() + 1;
    range = sheet.getRange('A' + lastRow + ':' + lastRow);
  } else {
    range = !!rangeA1 ? spreadsheet.getRange(rangeA1) : SpreadsheetApp.getActiveRange();
  }
  // check if data exists
  if(
    !spreadsheetId &&
    !!getData()
  ) {
    const ui = SpreadsheetApp.getUi();
    const result = ui.alert(
      'Overwrite data',
      'Data exists, overwrite anyway?',
      ui.ButtonSet.YES_NO,
    );
    // Process the user's response.
    if (result !== ui.Button.YES) return;
  }
  // set the data
  return (range.getWidth() <= 1 && range.getHeight() <= 1) ?
    range.setValue(data) : range.setValues(data);
}

function transformValue(values: any[], noHeaders = false) {
  const items = [];
  // header
  let headers = ['value'];
  let data = values || [];
  if(!noHeaders) {
    headers = values[0] || [],
    data = values.slice(1, values.length) || [];
  }
  // content
  for (let i = 0; i < data.length; i++) {
    const rows = data[i];
    const item = {};
    for (let j = 0; j < rows.length; j++) {
      if(rows[j]) {
        let val = rows[j];
        // parse value
        if ((data + '').toLowerCase() === 'true') {
          // boolean TRUE
          val = true;
        } else if ((val + '').toLowerCase() === 'false') {
          // boolean FALSE
          val = false;
        } else if (!isNaN(val)) {
          // number
          val = Number(val);
        } else if (
          (val.substr(0, 1) === '{' && val.substr(-1) === '}') ||
          (val.substr(0, 1) === '[' && val.substr(-1) === ']')
        ) {
          // JSON
          try {
            val = JSON.parse(val);
          } catch (e) {
            // continue
          }
        }
        // save parsed value
        item[headers[j] || (headers[0] + j)] = val;
      }
    }
    // only non-empty
    if(!!Object.keys(item).length) {
      items.push(item);
    }
  }
  // result
  return items;
}

function getDoc(docId: string, withStyle = false) {
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
