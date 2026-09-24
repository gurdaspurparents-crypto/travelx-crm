const fs = require('fs');
const path = require('path');
const db = require('./db');

const canonicalMap = {
  // Variations of Dera Baba Nanak
  'dera baba nanak': 'Dera Baba Nanak',

  // Dorangla
  'drongla': 'Dorangla',
  'dorangla': 'Dorangla',

  // Galhri
  'galhri': 'Galhri',

  // Barth Sahib
  'barth sahib': 'Barth Sahib',

  // Chak Sharif
  'chak sharif': 'Chak Sharif',

  // Dhariwal
  'dhariwal': 'Dhariwal',

  // Gharota
  'gharota': 'Gharota',

  // Gurdaspur
  'gurdaspur': 'Gurdaspur',
  'gurdaspr': 'Gurdaspur',

  // Ghuman
  'ghuman': 'Ghuman',
  'ghoman': 'Ghuman',

  // Jangal Bhawani
  'jangal bhawani': 'Jangal Bhawani',
  'jungal bhawani': 'Jangal Bhawani',

  // Kalanour
  'kalanour': 'Kalanour',
  'kalanaur': 'Kalanour',

  // Keshopur
  'keshopur': 'Keshopur',

  // Kot Santokh Rai
  'kot santokh rai': 'Kot Santokh Rai',

  // Kundha
  'kundha': 'Kundha',

  // Naushera Majha Singh
  'naushera majha singh': 'Naushera Majha Singh',
  'nushera majha singh': 'Naushera Majha Singh',

  // Nikke Ghuman
  'nikke ghuman': 'Nikke Ghuman',

  // Sarna
  'sarna': 'Sarna',

  // Sunderchak
  'sunderchak': 'Sunderchak',

  // Tibri
  'tibri': 'Tibri',

  // Udhanwal
  'udhanwal': 'Udhanwal',

  // Wadala Bangar
  'wadala bangar': 'Wadala Bangar',
  'wdla bangar': 'Wadala Bangar',

  // Dehriwal
  'dehriwal': 'Dehriwal',
  'dheriwal': 'Dehriwal',

  // Bhullar
  'bhullar vil. ( near batala )': 'Bhullar',
  'bhullar vil.': 'Bhullar',
  'bhullar': 'Bhullar',

  // Wadala Granthia
  'wadala granthia': 'Wadala Granthia',
  'wadla granthia': 'Wadala Granthia',
  'wdla granthia': 'Wadala Granthia',

  // Warsola
  'warsola': 'Warsola',

  // Sidhwan
  'sidhwan': 'Sidhwan',
  'sidhwa': 'Sidhwan',

  // Parmanand
  'paramnanad': 'Parmanand',
  'parmanand': 'Parmanand',

  // Amritsar
  'amritsar': 'Amritsar',

  // Pathankot
  'pathankot': 'Pathankot',

  // Krishna Nagar
  'krishna nagar': 'Krishna Nagar',

  // Aujla Bypass
  'aujla bye pass': 'Aujla Bypass',
  'aujla bypass': 'Aujla Bypass',

  // Sri Hargobindpur
  'shrihrgobinpur rd': 'Sri Hargobindpur',
  'shri hargobindpur': 'Sri Hargobindpur',
  'sri hargobindpur': 'Sri Hargobindpur',

  // Bhagwanpur
  'bagwanpur': 'Bhagwanpur',
  'bhagwanpur': 'Bhagwanpur',

  // Country placeholder
  'country': 'Other',

  // Behrampur
  'behrampur': 'Behrampur',

  // Bhaini Mia Khan
  'bhaini mia khan': 'Bhaini Mia Khan',

  // Dinanagar
  'dinanagar': 'Dinanagar',
  'dnn': 'Dinanagar',

  // Jahkolri
  'jahkolri': 'Jahkolri',
  'jakholari': 'Jahkolri',

  // Naranwali
  'naranwali': 'Naranwali',

  // Qadian
  'qadian': 'Qadian',

  // Taragarh
  'taragarh': 'Taragarh',

  // Sathiali
  'sathiali': 'Sathiali',
  'sathali': 'Sathiali',

  // Seikhwan
  'seikhwan': 'Seikhwan',
  'sekhwan': 'Seikhwan',
};

function normalizeName(name) {
  if (!name) return name;
  const cleaned = name.trim().replace(/\s+/g, ' ');
  const lower = cleaned.toLowerCase();
  if (canonicalMap[lower]) {
    return canonicalMap[lower];
  }
  // Title Case default
  return cleaned
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function run() {
  const remotePath = path.resolve(__dirname, '../remote_liveBackup.json');
  if (!fs.existsSync(remotePath)) {
    console.error('remote_liveBackup.json does not exist!');
    process.exit(1);
  }

  console.log('Loading latest remote production data...');
  const data = JSON.parse(fs.readFileSync(remotePath, 'utf8'));

  // Clear tables
  await db.dbRun('DELETE FROM queries');
  await db.dbRun('DELETE FROM telephonic_calls');
  await db.dbRun('DELETE FROM marketing_visits');
  await db.dbRun('DELETE FROM field_trips');
  await db.dbRun('DELETE FROM agents');

  console.log(`Inserting ${data.agents.length} agents...`);
  for (const a of data.agents) {
    const cleanCity = normalizeName(a.city);
    await db.dbRun(
      `INSERT INTO agents (id, name, company_name, mobile, city, area, agent_type, stage, assigned_marketing_exec, assigned_telephonic_exec, created_at, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [a.id, a.name, a.company_name, a.mobile, cleanCity, a.area, a.agent_type, a.stage, a.assigned_marketing_exec || 'Bikramjit Singh', a.assigned_telephonic_exec || 'Simranjit Kaur', a.created_at || '2026-09-01', a.payment_terms || 'Not Discussed']
    );
  }

  const visits = data.marketing_visits || data.visits || [];
  console.log(`Inserting ${visits.length} visits...`);
  for (const v of visits) {
    const cleanLoc = normalizeName(v.location);
    await db.dbRun(
      `INSERT INTO marketing_visits (id, visit_date, agent_id, executive_name, person_met, mobile, is_new_agent, products_pitched, response_level, remarks, next_followup_date, location, gps_latitude, gps_longitude, gps_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.id, v.visit_date, v.agent_id, v.executive_name, v.person_met, v.mobile, v.is_new_agent ? 1 : 0, typeof v.products_pitched === 'object' ? JSON.stringify(v.products_pitched) : v.products_pitched, v.response_level, v.remarks, v.next_followup_date, cleanLoc, v.gps_latitude, v.gps_longitude, v.gps_address]
    );
  }

  const calls = data.telephonic_calls || data.calls || [];
  console.log(`Inserting ${calls.length} calls...`);
  for (const c of calls) {
    await db.dbRun(
      `INSERT INTO telephonic_calls (id, call_date, agent_id, visit_id, executive_name, is_connected, services_discussed, agent_requirement, interest_level, call_result, remarks, next_followup_date, payment_terms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.call_date, c.agent_id, c.visit_id, c.executive_name, c.is_connected ? 1 : 0, typeof c.services_discussed === 'object' ? JSON.stringify(c.services_discussed) : c.services_discussed, c.agent_requirement, c.interest_level, c.call_result, c.remarks, c.next_followup_date, c.payment_terms]
    );
  }

  const queries = data.queries || [];
  console.log(`Inserting ${queries.length} queries...`);
  for (const q of queries) {
    await db.dbRun(
      `INSERT INTO queries (id, query_date, agent_id, product, query_details, travel_date, pax_details, estimated_value, quoted_amount, handling_employee, followup_date, status, booking_date, booking_value, booking_ref_no, closing_employee, rejection_reason, rejection_remarks)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [q.id, q.query_date, q.agent_id, q.product, q.query_details, q.travel_date, q.pax_details, q.estimated_value, q.quoted_amount, q.handling_employee, q.followup_date, q.status, q.booking_date, q.booking_value, q.booking_ref_no, q.closing_employee, q.rejection_reason, q.rejection_remarks]
    );
  }

  const field_trips = data.field_trips || [];
  console.log(`Inserting ${field_trips.length} field trips...`);
  for (const ft of field_trips) {
    await db.dbRun(
      `INSERT INTO field_trips (id, trip_date, executive_name, start_meter_reading, end_meter_reading, start_time, end_time, start_location, end_location, total_km, rate_per_km, conveyance_amount, status, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ft.id, ft.trip_date, ft.executive_name, ft.start_meter_reading, ft.end_meter_reading, ft.start_time, ft.end_time, ft.start_location, ft.end_location, ft.total_km, ft.rate_per_km, ft.conveyance_amount, ft.status, ft.remarks, ft.created_at]
    );
  }

  // Verify cities
  const finalCities = await db.dbAll(`SELECT city, COUNT(*) as count FROM agents GROUP BY city ORDER BY city COLLATE NOCASE`);
  console.log('\n--- VERIFIED CLEAN AGENT CITIES ---');
  console.table(finalCities);

  // Export fresh clean backup with both key pairs
  const allAgents = await db.dbAll(`SELECT * FROM agents ORDER BY id ASC`);
  const allVisits = await db.dbAll(`SELECT * FROM marketing_visits ORDER BY id ASC`);
  const allCalls = await db.dbAll(`SELECT * FROM telephonic_calls ORDER BY id ASC`);
  const allQueries = await db.dbAll(`SELECT * FROM queries ORDER BY id ASC`);
  const allTrips = await db.dbAll(`SELECT * FROM field_trips ORDER BY id ASC`);

  const cleanBackupData = {
    backed_up_at: new Date().toISOString(),
    agents: allAgents,
    visits: allVisits,
    marketing_visits: allVisits,
    calls: allCalls,
    telephonic_calls: allCalls,
    queries: allQueries,
    field_trips: allTrips
  };

  const backupJson = JSON.stringify(cleanBackupData, null, 2);
  fs.writeFileSync(path.resolve(__dirname, 'liveBackup.json'), backupJson, 'utf8');
  fs.writeFileSync(path.resolve(__dirname, '../liveBackup.json'), backupJson, 'utf8');
  console.log('✅ Updated server/liveBackup.json and root liveBackup.json!');

  // Sync DB
  fs.copyFileSync(path.resolve(__dirname, 'travelx.db'), path.resolve(__dirname, '../travelx.db'));
  console.log('✅ Synchronized travelx.db to root!');

  // Delete temp file
  if (fs.existsSync(remotePath)) fs.unlinkSync(remotePath);

  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during sync & clean:', err);
  process.exit(1);
});
