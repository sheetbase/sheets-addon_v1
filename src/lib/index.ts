function onOpen(e) {
  SpreadsheetApp.getUi()
    .createMenu('Sheetbase')
    .addItem('JSON Editor', 'jsonEditorSidebar')
    .addItem('HTML Editor', 'htmlEditorSidebar')
    .addSeparator()
    .addItem('Taxonomy Editor', 'taxonomyEditorSidebar')
    .addToUi();
}

function onInstall(e) {
  return onOpen(e);
}