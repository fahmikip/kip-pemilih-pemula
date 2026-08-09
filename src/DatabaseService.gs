function getDatabase_() {
  const id = PropertiesService.getScriptProperties().getProperty(APP.DATABASE_PROPERTY);
  if (!id) throw new Error('Database belum disiapkan. Jalankan setupApplication().');
  return SpreadsheetApp.openById(id);
}

function ensureDatabase_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(APP.DATABASE_PROPERTY);
  if (existingId) {
    try { return SpreadsheetApp.openById(existingId); } catch (error) { /* create replacement */ }
  }
  const spreadsheet = SpreadsheetApp.create(APP.NAME + ' Database');
  properties.setProperty(APP.DATABASE_PROPERTY, spreadsheet.getId());
  return spreadsheet;
}

function ensureDriveFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty(APP.DRIVE_FOLDER_PROPERTY);
  if (existingId) {
    try { return DriveApp.getFolderById(existingId); } catch (error) { /* create replacement */ }
  }
  const folder = DriveApp.createFolder(APP.NAME + ' Files');
  properties.setProperty(APP.DRIVE_FOLDER_PROPERTY, folder.getId());
  return folder;
}

function ensureSheet_(spreadsheet, name, headers) {
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) sheet = spreadsheet.insertSheet(name);
  const lastColumn = sheet.getLastColumn();
  const current = lastColumn ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0] : [];
  if (sheet.getLastRow() > 1 && current.length && current.join('|') !== headers.join('|')) {
    throw new Error('Schema sheet ' + name + ' berbeda dan berisi data. Migrasi manual diperlukan.');
  }
  if (current.join('|') !== headers.join('|')) {
    sheet.clear();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#123B66').setFontColor('#ffffff');
  return sheet;
}

function readTable_(name) {
  const sheet = getDatabase_().getSheetByName(name);
  if (!sheet) throw new Error('Sheet tidak ditemukan: ' + name);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(row => row.some(value => value !== '')).map(row =>
    headers.reduce((record, key, index) => { record[key] = row[index]; return record; }, {})
  );
}

function appendRecords_(name, records) {
  if (!records.length) return 0;
  const headers = DATABASE_SCHEMA[name];
  if (!headers) throw new Error('Entity tidak dikenal: ' + name);
  const sheet = getDatabase_().getSheetByName(name);
  const rows = records.map(record => headers.map(header => record[header] === undefined ? '' : record[header]));
  sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length).setValues(rows);
  return rows.length;
}

function findOne_(name, field, value) {
  return readTable_(name).find(record => String(record[field]) === String(value)) || null;
}

function updateRecord_(name, idField, idValue, changes) {
  const headers = DATABASE_SCHEMA[name];
  const sheet = getDatabase_().getSheetByName(name);
  const values = sheet.getDataRange().getValues();
  const idIndex = headers.indexOf(idField);
  if (idIndex < 0) throw new Error('Kolom ID tidak ditemukan: ' + idField);
  const rowIndex = values.slice(1).findIndex(row => String(row[idIndex]) === String(idValue));
  if (rowIndex < 0) return false;
  const row = values[rowIndex + 1].slice(0, headers.length);
  Object.keys(changes).forEach(key => {
    const column = headers.indexOf(key);
    if (column >= 0) row[column] = changes[key];
  });
  sheet.getRange(rowIndex + 2, 1, 1, headers.length).setValues([row]);
  return true;
}

function getSetting_(key, fallback) {
  const cached = CacheService.getScriptCache().get('setting:' + key);
  if (cached !== null) return cached;
  const record = findOne_('Settings', 'Key', key);
  const value = record ? String(record.Value) : fallback;
  CacheService.getScriptCache().put('setting:' + key, String(value), APP.CACHE_SECONDS);
  return value;
}

function upsertSetting_(key, value, type, description, actor) {
  const sheet = getDatabase_().getSheetByName('Settings');
  const rows = sheet.getDataRange().getValues();
  const timestamp = nowIso_();
  for (let index = 1; index < rows.length; index += 1) {
    if (rows[index][0] === key) {
      sheet.getRange(index + 1, 2, 1, 5).setValues([[String(value), type || 'STRING', description || rows[index][3], timestamp, actor || 'SYSTEM']]);
      return;
    }
  }
  appendRecords_('Settings', [{Key:key, Value:String(value), Type:type || 'STRING', Description:description || '', UpdatedAt:timestamp, UpdatedBy:actor || 'SYSTEM'}]);
}
