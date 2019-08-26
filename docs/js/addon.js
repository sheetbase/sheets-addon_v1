function errorAlert(error, title) {
  error = typeof error === "string" ? new Error(error) : error;
  // show in console
  console.error(error);
  // show in alert
  return google.script.run.displayError(error.message, title);
}
