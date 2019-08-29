// JSON Editor
function jsonEditorSidebar() {
  return SpreadsheetApp.getUi().showSidebar(
    HtmlService
    .createHtmlOutputFromFile('JsonEditor')
    .setTitle('JSON Editor'),
  );
}

// HTML Editor
function htmlEditorSidebar() {
  return SpreadsheetApp.getUi().showSidebar(
    HtmlService
    .createHtmlOutputFromFile('HtmlEditor')
    .setTitle('HTML Editor'),
  );
}

// Linking Editor
function linkingEditorSidebar() {
  return SpreadsheetApp.getUi().showSidebar(
    HtmlService
    .createHtmlOutputFromFile('LinkingEditor')
    .setTitle('Linking Editor'),
  );
}

// Settings
function settingsDialog() {
  return SpreadsheetApp.getUi().showModalDialog(
    HtmlService
    .createHtmlOutputFromFile('Settings').setWidth(720).setHeight(480),
    'Sheetbase project',
  );
}

// init
function onOpen(e) {
  return SpreadsheetApp.getUi().createMenu('Sheetbase')
  .addItem('JSON Editor', 'jsonEditorSidebar')
  .addItem('HTML Editor', 'htmlEditorSidebar')
  .addItem('Linking Editor', 'linkingEditorSidebar')
  .addSeparator()
  .addItem('Settings', 'settingsDialog')
  .addToUi();
}
function onInstall(e) {
  return onOpen(e);
}
