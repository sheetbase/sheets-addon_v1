// https://developers.google.com/apps-script/reference/base/ui

export function displayError(message: string, title?: string) {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title || 'Oops!', message, ui.ButtonSet.OK);
}

export function confirmAlert(message: string, title?: string) {
  const ui = SpreadsheetApp.getUi();
  const result = ui.alert(title || 'Confirm?', message, ui.ButtonSet.YES_NO);
  return (result === ui.Button.YES);
}
