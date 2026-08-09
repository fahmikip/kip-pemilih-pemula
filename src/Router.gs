function doGet(event) {
  const template = HtmlService.createTemplateFromFile('index');
  template.appConfig = { name: APP.NAME, version: APP.VERSION };
  return template.evaluate().setTitle(APP.NAME).addMetaTag('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function include_(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
