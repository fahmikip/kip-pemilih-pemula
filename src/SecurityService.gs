function ensurePasswordPepper_() {
  const properties = PropertiesService.getScriptProperties();
  if (!properties.getProperty(APP.PASSWORD_PEPPER_PROPERTY)) {
    properties.setProperty(APP.PASSWORD_PEPPER_PROPERTY, Utilities.getUuid() + Utilities.getUuid());
  }
}

function hashPassword_(password, salt) {
  const pepper = PropertiesService.getScriptProperties().getProperty(APP.PASSWORD_PEPPER_PROPERTY);
  if (!pepper) throw new Error('Password pepper belum tersedia.');
  let digest = String(password) + ':' + salt + ':' + pepper;
  for (let round = 0; round < 12000; round += 1) {
    digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, digest)
      .map(byte => (byte + 256) % 256).map(byte => ('0' + byte.toString(16)).slice(-2)).join('');
  }
  return digest;
}

function createPasswordRecord_(password) {
  if (String(password || '').length < 10) throw new Error('Password minimal 10 karakter.');
  const salt = Utilities.getUuid().replace(/-/g, '');
  return { PasswordSalt: salt, PasswordHash: hashPassword_(password, salt) };
}

function createInitialAdmin_() {
  const props = PropertiesService.getScriptProperties();
  const email = normalizeEmail_(props.getProperty(APP.DEFAULT_ADMIN_EMAIL_PROPERTY));
  const password = props.getProperty(APP.DEFAULT_ADMIN_PASSWORD_PROPERTY);
  if (!email || !password || readTable_('Users').some(user => user.Role === 'SUPERADMIN')) return false;
  const credential = createPasswordRecord_(password);
  const timestamp = nowIso_();
  appendRecords_('Users', [{
    UserID: generateId_('Users'), Name: 'Super Administrator', Email: email,
    PasswordHash: credential.PasswordHash, PasswordSalt: credential.PasswordSalt,
    Role: 'SUPERADMIN', Status: 'ACTIVE', TotalPointCache: 0, FraudScore: 0,
    CreatedAt: timestamp, UpdatedAt: timestamp
  }]);
  props.deleteProperty(APP.DEFAULT_ADMIN_PASSWORD_PROPERTY);
  return true;
}
