/**
 * Audit Log Service
 * Provides immutable, append-only audit trail for all system modifications
 */

export function createAuditEntry({
  userId,
  userName,
  action,
  entityType,
  entityId,
  changes = {},
  metadata = {}
}) {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    timestamp: new Date().toISOString(),
    userId,
    userName,
    action,
    entityType,
    entityId,
    changes,
    metadata
  };
}

export function filterAuditLog(auditLog, filters = {}) {
  let filtered = [...auditLog];

  if (filters.startDate) {
    filtered = filtered.filter(entry => 
      new Date(entry.timestamp) >= new Date(filters.startDate)
    );
  }

  if (filters.endDate) {
    filtered = filtered.filter(entry => 
      new Date(entry.timestamp) <= new Date(filters.endDate)
    );
  }

  if (filters.userId) {
    filtered = filtered.filter(entry => entry.userId === filters.userId);
  }

  if (filters.entityType) {
    filtered = filtered.filter(entry => entry.entityType === filters.entityType);
  }

  if (filters.entityId) {
    filtered = filtered.filter(entry => entry.entityId === filters.entityId);
  }

  if (filters.action) {
    filtered = filtered.filter(entry => entry.action === filters.action);
  }

  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    filtered = filtered.filter(entry => 
      entry.action.toLowerCase().includes(term) ||
      entry.userName.toLowerCase().includes(term) ||
      entry.entityType.toLowerCase().includes(term) ||
      JSON.stringify(entry.changes).toLowerCase().includes(term)
    );
  }

  return filtered;
}

export function getAuditStats(auditLog) {
  const stats = {
    totalEntries: auditLog.length,
    byAction: {},
    byEntityType: {},
    byUser: {},
    byDate: {}
  };

  auditLog.forEach(entry => {
    // By action
    stats.byAction[entry.action] = (stats.byAction[entry.action] || 0) + 1;

    // By entity type
    stats.byEntityType[entry.entityType] = (stats.byEntityType[entry.entityType] || 0) + 1;

    // By user
    stats.byUser[entry.userName] = (stats.byUser[entry.userName] || 0) + 1;

    // By date
    const date = new Date(entry.timestamp).toISOString().split('T')[0];
    stats.byDate[date] = (stats.byDate[date] || 0) + 1;
  });

  return stats;
}

export function exportAuditLogCSV(auditLog) {
  const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Changes'];
  const rows = auditLog.map(entry => [
    entry.timestamp,
    entry.userName,
    entry.action,
    entry.entityType,
    entry.entityId,
    JSON.stringify(entry.changes)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
}

export function downloadAuditLogCSV(auditLog, filename = 'audit-log.csv') {
  const csv = exportAuditLogCSV(auditLog);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function getRecentActivity(auditLog, limit = 10) {
  return [...auditLog]
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

export function getUserActivity(auditLog, userId) {
  return auditLog
    .filter(entry => entry.userId === userId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

export function getProjectActivity(auditLog, projectId) {
  return auditLog
    .filter(entry => 
      entry.entityId === projectId || 
      entry.changes?.projectId === projectId
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Action constants
export const AUDIT_ACTIONS = {
  PROJECT_CREATE: 'project:create',
  PROJECT_UPDATE: 'project:update',
  PROJECT_DELETE: 'project:delete',
  PROJECT_PUBLISH: 'project:publish',
  
  DAMAGE_REPORT_CREATE: 'damage_report:create',
  DAMAGE_REPORT_UPDATE: 'damage_report:update',
  
  PLAN_CREATE: 'plan:create',
  PLAN_UPDATE: 'plan:update',
  
  BID_SUBMIT: 'bid:submit',
  BID_AWARD: 'bid:award',
  BID_REJECT: 'bid:reject',
  
  RESOURCE_RESERVE: 'resource:reserve',
  RESOURCE_RELEASE: 'resource:release',
  
  LICENSE_ISSUE: 'license:issue',
  LICENSE_REVOKE: 'license:revoke',
  
  DECISION_APPROVE: 'decision:approve',
  DECISION_REJECT: 'decision:reject',
  DECISION_PROVISIONAL: 'decision:provisional',
  DECISION_FINALIZE: 'decision:finalize',
  
  USER_LOGIN: 'user:login',
  USER_LOGOUT: 'user:logout',
  USER_REGISTER: 'user:register',
  
  SUPERVISOR_ASSIGN: 'supervisor:assign',
  SUPERVISOR_REMOVE: 'supervisor:remove',
  
  SETTINGS_UPDATE: 'settings:update'
};

export default {
  createAuditEntry,
  filterAuditLog,
  getAuditStats,
  exportAuditLogCSV,
  downloadAuditLogCSV,
  getRecentActivity,
  getUserActivity,
  getProjectActivity,
  AUDIT_ACTIONS
};
