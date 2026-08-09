function logActivity_(userId, action, entity, entityId, description, device) {
  appendRecords_('ActivityLogs', [{
    LogID:generateId_('ActivityLogs'), UserID:userId || '', Action:action, Entity:entity || '', EntityID:entityId || '',
    Description:sanitizeText_(description, 500), Device:sanitizeText_(device, 250), Timestamp:nowIso_()
  }]);
}
