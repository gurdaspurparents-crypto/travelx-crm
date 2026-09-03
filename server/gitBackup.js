/**
 * gitBackup.js - Auto GitHub Backup System
 * Every time a visit/call/query is added, this saves data to GitHub.
 * On server restart, data is restored from GitHub automatically.
 */

const https = require('https');
const path = require('path');
const fs = require('fs');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO = 'gurdaspurparents-crypto/travelx-crm';
const FILE_PATH = 'liveBackup.json';
const BRANCH = 'main';

// Helper: make GitHub API request
function githubRequest(method, endpoint, body) {
  return new Promise((resolve, reject) => {
    if (!GITHUB_TOKEN) {
      return reject(new Error('GITHUB_TOKEN not set'));
    }
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.github.com',
      path: endpoint,
      method,
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'TravelxCRM-AutoBackup/1.0',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(responseData)); }
        catch (e) { resolve(responseData); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// Get current file SHA from GitHub (needed for updates)
async function getFileSha() {
  try {
    const result = await githubRequest('GET', `/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);
    return result.sha || null;
  } catch (e) {
    return null;
  }
}

// BACKUP: Export all live data to GitHub
async function backupToGitHub(db) {
  try {
    if (!GITHUB_TOKEN) {
      console.log('[Backup] GITHUB_TOKEN not set, skipping backup');
      return;
    }

    // Export all data
    const data = await new Promise((resolve, reject) => {
      const result = { marketing_visits: [], telephonic_calls: [], queries: [], backed_up_at: new Date().toISOString() };
      let done = 0;
      const tables = [
        { key: 'marketing_visits', query: 'SELECT * FROM marketing_visits' },
        { key: 'telephonic_calls', query: 'SELECT * FROM telephonic_calls' },
        { key: 'queries', query: 'SELECT * FROM queries' }
      ];
      tables.forEach(({ key, query }) => {
        db.all(query, [], (err, rows) => {
          if (!err) result[key] = rows;
          if (++done === tables.length) resolve(result);
        });
      });
    });

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
    const sha = await getFileSha();

    const body = {
      message: `Auto-backup: ${data.marketing_visits.length} visits, ${data.telephonic_calls.length} calls, ${data.queries.length} queries`,
      content,
      branch: BRANCH,
      ...(sha ? { sha } : {})
    };

    await githubRequest('PUT', `/repos/${REPO}/contents/${FILE_PATH}`, body);
    console.log(`[Backup] ✅ Saved to GitHub: ${data.marketing_visits.length} visits, ${data.telephonic_calls.length} calls, ${data.queries.length} queries`);
  } catch (err) {
    console.error('[Backup] ❌ GitHub backup failed:', err.message);
  }
}

// RESTORE: Fetch latest backup from GitHub on startup
async function restoreFromGitHub(db, dbRun, dbAll) {
  try {
    if (!GITHUB_TOKEN) {
      console.log('[Restore] GITHUB_TOKEN not set, skipping restore');
      return false;
    }

    console.log('[Restore] Fetching latest backup from GitHub...');
    const result = await githubRequest('GET', `/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`);

    if (!result.content) {
      console.log('[Restore] No backup file found on GitHub');
      return false;
    }

    const raw = Buffer.from(result.content, 'base64').toString('utf8');
    const data = JSON.parse(raw);
    console.log(`[Restore] Found backup from: ${data.backed_up_at}`);
    console.log(`[Restore] ${data.marketing_visits.length} visits, ${data.telephonic_calls.length} calls, ${data.queries.length} queries`);

    // Restore marketing visits
    for (const v of (data.marketing_visits || [])) {
      await dbRun(
        `INSERT OR REPLACE INTO marketing_visits (id, visit_date, agent_id, executive_name, person_met, mobile, is_new_agent, products_pitched, response_level, remarks, next_followup_date, location, gps_latitude, gps_longitude, gps_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.visit_date, v.agent_id, v.executive_name, v.person_met, v.mobile, v.is_new_agent, v.products_pitched, v.response_level, v.remarks, v.next_followup_date, v.location, v.gps_latitude, v.gps_longitude, v.gps_address]
      );
    }

    // Restore telephonic calls
    for (const c of (data.telephonic_calls || [])) {
      await dbRun(
        `INSERT OR REPLACE INTO telephonic_calls (id, call_date, agent_id, visit_id, executive_name, is_connected, services_discussed, agent_requirement, interest_level, call_result, remarks, next_followup_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [c.id, c.call_date, c.agent_id, c.visit_id, c.executive_name, c.is_connected, c.services_discussed, c.agent_requirement, c.interest_level, c.call_result, c.remarks, c.next_followup_date]
      );
    }

    // Restore queries
    for (const q of (data.queries || [])) {
      await dbRun(
        `INSERT OR REPLACE INTO queries (id, query_date, agent_id, product, query_details, travel_date, pax_details, estimated_value, quoted_amount, handling_employee, followup_date, status, booking_date, booking_value, booking_ref_no, closing_employee, rejection_reason, rejection_remarks)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [q.id, q.query_date, q.agent_id, q.product, q.query_details, q.travel_date, q.pax_details, q.estimated_value, q.quoted_amount, q.handling_employee, q.followup_date, q.status, q.booking_date, q.booking_value, q.booking_ref_no, q.closing_employee, q.rejection_reason, q.rejection_remarks]
      );
    }

    console.log('[Restore] ✅ GitHub backup restored successfully!');
    return true;
  } catch (err) {
    console.error('[Restore] ❌ Restore failed:', err.message);
    return false;
  }
}

// Debounced backup - wait 5 seconds after last write before saving
let backupTimer = null;
let dbInstance = null;

function scheduleBackup(db) {
  dbInstance = db;
  if (backupTimer) clearTimeout(backupTimer);
  backupTimer = setTimeout(() => {
    backupToGitHub(dbInstance);
  }, 5000); // 5 second delay to batch multiple writes
}

module.exports = { backupToGitHub, restoreFromGitHub, scheduleBackup };
