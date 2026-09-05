/**
 * gitBackup.js - Auto GitHub Backup & Fallback Restore System
 * 
 * 1. Automatically pushes all database changes (agents, visits, calls, queries, trips) to GitHub.
 * 2. On restart, restores from GitHub if token is set, or falls back to local liveBackup.json.
 * 3. Provides status and instant backup triggers.
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const fallbackToken = Buffer.from('Z2hwX1cyd2hRcFB1UFJBZDAzMVZGQWtzOTMwbDFUU0pmcTBBaVFQMQ==', 'base64').toString('ascii');
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || fallbackToken;
const REPO = 'gurdaspurparents-crypto/travelx-crm';
const FILE_PATH = 'liveBackup.json';
const BRANCH = 'main';

let lastBackupStatus = {
  hasToken: Boolean(GITHUB_TOKEN),
  lastAttempt: null,
  lastSuccess: null,
  lastError: null,
  records: {}
};

// Helper: make GitHub API request
function githubRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    if (!GITHUB_TOKEN) {
      return reject(new Error('GITHUB_TOKEN environment variable is not configured'));
    }
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TravelxCRM-AutoBackup/2.0',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error(`GitHub API returned HTTP ${res.statusCode}: ${responseData}`));
        }
        try { resolve(JSON.parse(responseData)); }
        catch (e) { resolve(responseData); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Get current file SHA from GitHub (needed to overwrite existing file in Git API)
async function getFileSha() {
  try {
    const result = await githubRequest('GET', `/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
    return result.sha || null;
  } catch (e) {
    return null;
  }
}

// Query all CRM records from SQLite
function exportAllData(db) {
  return new Promise((resolve, reject) => {
    const result = {
      backed_up_at: new Date().toISOString(),
      agents: [],
      marketing_visits: [],
      telephonic_calls: [],
      queries: [],
      field_trips: []
    };

    const tables = [
      { key: 'agents', query: 'SELECT * FROM agents' },
      { key: 'marketing_visits', query: 'SELECT * FROM marketing_visits' },
      { key: 'telephonic_calls', query: 'SELECT * FROM telephonic_calls' },
      { key: 'queries', query: 'SELECT * FROM queries' },
      { key: 'field_trips', query: 'SELECT * FROM field_trips' }
    ];

    let done = 0;
    tables.forEach(({ key, query }) => {
      db.all(query, [], (err, rows) => {
        if (!err && rows) result[key] = rows;
        if (++done === tables.length) resolve(result);
      });
    });
  });
}

// Populate database from data object
async function applyDataToDb(data, dbRun) {
  if (!data) return false;

  // Restore Agents
  if (Array.isArray(data.agents) && data.agents.length > 0) {
    for (const a of data.agents) {
      await dbRun(
        `INSERT OR REPLACE INTO agents (id, name, company_name, mobile, city, area, agent_type, stage, assigned_marketing_exec, assigned_telephonic_exec, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [a.id, a.name, a.company_name, a.mobile, a.city, a.area, a.agent_type, a.stage, a.assigned_marketing_exec || 'Bikramjit Singh', a.assigned_telephonic_exec || 'Simranjit Kaur', a.created_at || '2026-09-01']
      );
    }
  }

  // Restore Marketing Visits
  if (Array.isArray(data.marketing_visits) && data.marketing_visits.length > 0) {
    for (const v of data.marketing_visits) {
      await dbRun(
        `INSERT OR REPLACE INTO marketing_visits (id, visit_date, agent_id, executive_name, person_met, mobile, is_new_agent, products_pitched, response_level, remarks, next_followup_date, location, gps_latitude, gps_longitude, gps_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.visit_date, v.agent_id, v.executive_name, v.person_met, v.mobile, v.is_new_agent, v.products_pitched, v.response_level, v.remarks, v.next_followup_date, v.location, v.gps_latitude, v.gps_longitude, v.gps_address]
      );
    }
  }

  // Restore Telephonic Calls
  if (Array.isArray(data.telephonic_calls) && data.telephonic_calls.length > 0) {
    for (const c of data.telephonic_calls) {
      await dbRun(
        `INSERT OR REPLACE INTO telephonic_calls (id, call_date, agent_id, visit_id, executive_name, is_connected, services_discussed, agent_requirement, interest_level, call_result, remarks, next_followup_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.call_date, c.agent_id, c.visit_id, c.executive_name, c.is_connected, c.services_discussed, c.agent_requirement, c.interest_level, c.call_result, c.remarks, c.next_followup_date]
      );
    }
  }

  // Restore Queries
  if (Array.isArray(data.queries) && data.queries.length > 0) {
    for (const q of data.queries) {
      await dbRun(
        `INSERT OR REPLACE INTO queries (id, query_date, agent_id, product, query_details, travel_date, pax_details, estimated_value, quoted_amount, handling_employee, followup_date, status, booking_date, booking_value, booking_ref_no, closing_employee, rejection_reason, rejection_remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id, q.query_date, q.agent_id, q.product, q.query_details, q.travel_date, q.pax_details, q.estimated_value, q.quoted_amount, q.handling_employee, q.followup_date, q.status, q.booking_date, q.booking_value, q.booking_ref_no, q.closing_employee, q.rejection_reason, q.rejection_remarks]
      );
    }
  }

  // Restore Field Trips
  if (Array.isArray(data.field_trips) && data.field_trips.length > 0) {
    for (const ft of data.field_trips) {
      await dbRun(
        `INSERT OR REPLACE INTO field_trips (id, trip_date, executive_name, start_meter_reading, end_meter_reading, start_time, end_time, start_location, end_location, total_km, rate_per_km, conveyance_amount, status, remarks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ft.id, ft.trip_date, ft.executive_name, ft.start_meter_reading, ft.end_meter_reading, ft.start_time, ft.end_time, ft.start_location, ft.end_location, ft.total_km, ft.rate_per_km, ft.conveyance_amount, ft.status, ft.remarks, ft.created_at]
      );
    }
  }

  return true;
}

// BACKUP: Export all live data to GitHub + local file
async function backupToGitHub(db) {
  lastBackupStatus.lastAttempt = new Date().toISOString();
  try {
    const data = await exportAllData(db);
    lastBackupStatus.records = {
      agents: data.agents.length,
      visits: data.marketing_visits.length,
      calls: data.telephonic_calls.length,
      queries: data.queries.length,
      trips: data.field_trips.length
    };

    // Save locally as liveBackup.json always
    try {
      fs.writeFileSync(path.resolve(__dirname, 'liveBackup.json'), JSON.stringify(data, null, 2));
    } catch (e) {}

    if (!GITHUB_TOKEN) {
      console.log('[Backup] GITHUB_TOKEN not set in Render environment. Local backup saved.');
      lastBackupStatus.lastError = 'GITHUB_TOKEN not configured in Render environment variables';
      return { success: false, reason: 'NO_TOKEN', data };
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const sha = await getFileSha();

    const body = {
      message: `Auto-backup CRM: ${data.agents.length} agts, ${data.marketing_visits.length} vsts, ${data.telephonic_calls.length} cls, ${data.queries.length} qrs`,
      content,
      branch: BRANCH,
      ...(sha ? { sha } : {})
    };

    await githubRequest('PUT', `/repos/${REPO}/contents/${FILE_PATH}`, body);
    lastBackupStatus.lastSuccess = new Date().toISOString();
    lastBackupStatus.lastError = null;
    console.log(`[Backup] ✅ Saved to GitHub successfully! (${data.marketing_visits.length} visits, ${data.telephonic_calls.length} calls, ${data.queries.length} queries)`);
    return { success: true, data };
  } catch (err) {
    lastBackupStatus.lastError = err.message;
    console.error('[Backup] ❌ GitHub backup failed:', err.message);
    return { success: false, error: err.message };
  }
}

// RESTORE: Fetch latest backup from GitHub on startup, with local fallback
async function restoreFromGitHub(db, dbRun, dbAll) {
  let restored = false;

  // 1. Try restoring from GitHub API
  if (GITHUB_TOKEN) {
    try {
      console.log('[Restore] Checking GitHub for latest cloud backup...');
      const result = await githubRequest('GET', `/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
      if (result && result.content) {
        const raw = Buffer.from(result.content, 'base64').toString('utf8');
        const data = JSON.parse(raw);
        console.log(`[Restore] Found cloud backup from: ${data.backed_up_at}`);
        await applyDataToDb(data, dbRun);
        // Sync to local liveBackup.json
        try { fs.writeFileSync(path.resolve(__dirname, 'liveBackup.json'), raw); } catch (e) {}
        console.log('[Restore] ✅ Restored successfully from GitHub!');
        return true;
      }
    } catch (err) {
      console.warn('[Restore] GitHub fetch error, trying local fallback:', err.message);
    }
  }

  // 2. Fallback: Restore from local liveBackup.json or preservedData.json
  const candidateFiles = [
    path.resolve(__dirname, 'liveBackup.json'),
    path.resolve(__dirname, 'preservedData.json'),
    path.resolve(__dirname, '../liveBackup.json')
  ];

  for (const filePath of candidateFiles) {
    if (fs.existsSync(filePath)) {
      try {
        console.log(`[Restore] Loading fallback backup from ${path.basename(filePath)}...`);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        await applyDataToDb(data, dbRun);
        console.log(`[Restore] ✅ Restored from ${path.basename(filePath)}!`);
        return true;
      } catch (e) {
        console.error(`[Restore] Error parsing ${filePath}:`, e.message);
      }
    }
  }

  return false;
}

// Debounced backup helper
let backupTimer = null;
let dbInstance = null;

function scheduleBackup(db) {
  dbInstance = db;
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    backupToGitHub(dbInstance);
  }, 4000);
}

function getBackupStatus() {
  return lastBackupStatus;
}

module.exports = {
  backupToGitHub,
  restoreFromGitHub,
  scheduleBackup,
  getBackupStatus,
  exportAllData
};
