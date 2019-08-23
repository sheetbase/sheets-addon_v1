// https://developers.google.com/apps-script/reference/base/ui

export function displayError(message: string, title = 'Oops, something wrong!') {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, message, ui.ButtonSet.OK);
}