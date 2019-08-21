export function displayError(message: string, title = 'Oops, something wrong!') {
  const ui = SpreadsheetApp.getUi();
  return ui.alert(title, message, ui.ButtonSet.OK);
}