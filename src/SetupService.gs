function setupApplication() {
  return withDocumentLock_(function () {
    ensurePasswordPepper_();
    const spreadsheet = ensureDatabase_();
    Object.keys(DATABASE_SCHEMA).forEach(name => ensureSheet_(spreadsheet, name, DATABASE_SCHEMA[name]));
    const defaultSheet = spreadsheet.getSheetByName('Sheet1');
    if (defaultSheet && Object.keys(DATABASE_SCHEMA).indexOf('Sheet1') === -1 && spreadsheet.getSheets().length > 1) {
      spreadsheet.deleteSheet(defaultSheet);
    }
    Object.keys(DEFAULT_SETTINGS).forEach(key => upsertSetting_(key, DEFAULT_SETTINGS[key], 'STRING', 'Konfigurasi bawaan aplikasi', 'SYSTEM'));
    ensureDriveFolder_();
    const adminCreated = createInitialAdmin_();
    CacheService.getScriptCache().removeAll(['settings', 'activeSeason']);
    return apiSuccess_({ spreadsheetId: spreadsheet.getId(), spreadsheetUrl: spreadsheet.getUrl(), adminCreated: adminCreated }, 'Setup aplikasi selesai.');
  });
}

function getSetupStatus() {
  const properties = PropertiesService.getScriptProperties();
  return apiSuccess_({
    configured: Boolean(properties.getProperty(APP.DATABASE_PROPERTY)),
    databaseId: properties.getProperty(APP.DATABASE_PROPERTY) || '',
    folderId: properties.getProperty(APP.DRIVE_FOLDER_PROPERTY) || '',
    version: APP.VERSION,
    schemaVersion: APP.SCHEMA_VERSION
  });
}
