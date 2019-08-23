import { displayError } from './ui';

// https://developers.google.com/apps-script/reference/spreadsheet/spreadsheet-app

export function getData(
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
  return !!raw ? data : transformValue_(data, noHeaders);
}

export function setData(
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

function transformValue_(values: any[], noHeaders = false) {
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

export function getAllSheets(spreadsheetId?: string) {
  const spreadsheet = !!spreadsheetId ?
  SpreadsheetApp.openById(spreadsheetId) :
  SpreadsheetApp.getActiveSpreadsheet();
  return spreadsheet.getSheets();
}

export function getAllSheetNames(spreadsheetId?: string) {
  const names: string[] = [];
  getAllSheets(spreadsheetId).forEach(sheet => names.push(sheet.getName()));
  return names;
}
