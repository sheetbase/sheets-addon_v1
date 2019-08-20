function jsonEditorSidebar() {
  return SpreadsheetApp.getUi().showSidebar(
    HtmlService
    .createHtmlOutputFromFile('JSONEditor')
    .setTitle('JSON Editor'),
  );
}

// function htmlEditorSidebar() {
//   return SpreadsheetApp.getUi().showSidebar(
//     HtmlService
//     .createHtmlOutputFromFile('views/HTMLEditor')
//     .setTitle('HTML Editor'),
//   );
// }

// function taxonomyEditorSidebar() {
//   return SpreadsheetApp.getUi().showSidebar(
//     HtmlService
//     .createHtmlOutputFromFile('views/TaxonomyEditor')
//     .setTitle('Taxonomy Editor'),
//   );
// }

function onOpen(e) {
  return SpreadsheetApp.getUi().createMenu('Sheetbase')
  .addItem('JSON Editor', 'jsonEditorSidebar')
  // .addItem('HTML Editor', 'htmlEditorSidebar')
  // .addSeparator()
  // .addItem('Taxonomy Editor', 'taxonomyEditorSidebar')
  .addToUi();
}

function onInstall(e) {
  return onOpen(e);
}
