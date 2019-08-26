// https://developers.google.com/apps-script/reference/base/ui

export function displayError(message: string, title?: string) {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title || 'Oops!', message, ui.ButtonSet.OK);
}