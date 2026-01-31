/**
 * Daily Briefing Service
 * Auto-generates daily summaries of system activity and urgent items
 */

import { URGENCY_LEVELS } from '../components/approvals/UrgencyClassifier.jsx';

export function generateDailyBrief(db, auth) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayISO = today.toISOString();
  const tomorrowISO = tomorrow.toISOString();

  // Filter today's audit entries
  const todayAudit = (db.audit || []).filter(entry => {
    const entryDate = new Date(entry.timestamp);
    return entryDate >= today && entryDate < tomorrow;
  });

  // Get pending decisions
  const pendingDecisions = (db.decisions || [])
    .filter(d => d.status === 'pending')
    .sort((a, b) => {
      const urgencyOrder = {
        [URGENCY_LEVELS.IMMEDIATE]: 1,
        [URGENCY_LEVELS.OPERATIONAL]: 2,
        [URGENCY_LEVELS.ADMINISTRATIVE]: 3
      };
      return (urgencyOrder[a.urgency] || 99) - (urgencyOrder[b.urgency] || 99);
    });

  // Get active projects in user's region
  const userProjects = (db.projects || []).filter(p => 
    p.regionId === auth.user?.regionId &&
    p.status !== 'Completed'
  );

  // Get recent bids
  const recentBids = (db.bids || [])
    .filter(b => new Date(b.submittedAt) >= today)
    .length;

  // Get statistics
  const stats = {
    totalProjects: userProjects.length,
    pendingApprovals: pendingDecisions.filter(d => d.urgency === URGENCY_LEVELS.IMMEDIATE).length,
    bidsToday: recentBids,
    activitiesLogged: todayAudit.length,
    urgentDecisions: pendingDecisions.filter(d => d.urgency === URGENCY_LEVELS.IMMEDIATE).length
  };

  // Group activities by type
  const activitySummary = todayAudit.reduce((acc, entry) => {
    const [entityType, action] = entry.action.split(':');
    if (!acc[entityType]) acc[entityType] = {};
    acc[entityType][action] = (acc[entityType][action] || 0) + 1;
    return acc;
  }, {});

  // Get upcoming deadlines (projects with target completion soon)
  const upcomingDeadlines = userProjects
    .filter(p => {
      if (!p.targetCompletion) return false;
      const targetDate = new Date(p.targetCompletion);
      const daysUntil = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
      return daysUntil >= 0 && daysUntil <= 7;
    })
    .sort((a, b) => new Date(a.targetCompletion) - new Date(b.targetCompletion));

  // Get newly assigned projects (if user is supervisor)
  const newAssignments = userProjects.filter(p => {
    const supervisors = p.supervisors || [];
    return supervisors.some(s => {
      return s.supervisorId === auth.user?.id && 
             new Date(s.assignedAt) >= today;
    });
  });

  // Key highlights
  const highlights = [];
  
  if (stats.urgentDecisions > 0) {
    highlights.push({
      type: 'urgent',
      message: `${stats.urgentDecisions} immediate decision(s) requiring attention`,
      priority: 1
    });
  }

  if (upcomingDeadlines.length > 0) {
    highlights.push({
      type: 'deadline',
      message: `${upcomingDeadlines.length} project(s) with deadlines this week`,
      priority: 2
    });
  }

  if (newAssignments.length > 0) {
    highlights.push({
      type: 'assignment',
      message: `${newAssignments.length} new project(s) assigned to you`,
      priority: 3
    });
  }

  if (recentBids > 0) {
    highlights.push({
      type: 'info',
      message: `${recentBids} new bid(s) submitted today`,
      priority: 4
    });
  }

  return {
    date: today.toISOString(),
    generatedAt: new Date().toISOString(),
    userId: auth.user?.id,
    userName: auth.user?.name,
    regionId: auth.user?.regionId,
    stats,
    highlights: highlights.sort((a, b) => a.priority - b.priority),
    pendingDecisions: pendingDecisions.slice(0, 5), // Top 5
    activitySummary,
    upcomingDeadlines,
    newAssignments,
    todayAudit: todayAudit.slice(0, 20) // Latest 20
  };
}

export function formatBriefForEmail(brief) {
  const { date, stats, highlights, pendingDecisions, upcomingDeadlines } = brief;
  const dateStr = new Date(date).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let html = `
    <h1>Daily Brief - ${dateStr}</h1>
    
    <h2> Key Statistics</h2>
    <ul>
      <li>Active Projects: ${stats.totalProjects}</li>
      <li>Pending Approvals: ${stats.pendingApprovals}</li>
      <li>New Bids: ${stats.bidsToday}</li>
      <li>Activities Logged: ${stats.activitiesLogged}</li>
    </ul>
  `;

  if (highlights.length > 0) {
    html += `<h2> Highlights</h2><ul>`;
    highlights.forEach(h => {
      const icon = h.type === 'urgent' ? '' : h.type === 'deadline' ? '' : '';
      html += `<li>${icon} ${h.message}</li>`;
    });
    html += `</ul>`;
  }

  if (pendingDecisions.length > 0) {
    html += `<h2> Pending Decisions</h2><ul>`;
    pendingDecisions.forEach(d => {
      html += `<li><strong>${d.type}</strong> - ${d.urgency} urgency</li>`;
    });
    html += `</ul>`;
  }

  if (upcomingDeadlines.length > 0) {
    html += `<h2> Upcoming Deadlines</h2><ul>`;
    upcomingDeadlines.forEach(p => {
      const daysUntil = Math.ceil((new Date(p.targetCompletion) - new Date()) / (1000 * 60 * 60 * 24));
      html += `<li><strong>${p.name}</strong> - ${daysUntil} days</li>`;
    });
    html += `</ul>`;
  }

  return html;
}

export function exportBriefPDF(brief) {
  // This would integrate with a PDF library like jsPDF
  // For now, return formatted text
  const text = formatBriefForEmail(brief);
  return text;
}

export default {
  generateDailyBrief,
  formatBriefForEmail,
  exportBriefPDF
};
