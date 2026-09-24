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
  console.log('Starting full city & location name standardization...');

  // 1. Standardize agents.city
  const agents = await db.dbAll(`SELECT id, city FROM agents WHERE city IS NOT NULL`);
  let updatedAgents = 0;
  for (const ag of agents) {
    const original = ag.city;
    const normalized = normalizeName(original);
    if (original !== normalized) {
      await db.dbRun(`UPDATE agents SET city = ? WHERE id = ?`, [normalized, ag.id]);
      updatedAgents++;
      console.log(`Agent ${ag.id}: "${original}" -> "${normalized}"`);
    }
  }
  console.log(`✅ Updated ${updatedAgents} agent city records.`);

  // 2. Standardize marketing_visits.location
  const visits = await db.dbAll(`SELECT id, location FROM marketing_visits WHERE location IS NOT NULL`);
  let updatedVisits = 0;
  for (const v of visits) {
    const original = v.location;
    const normalized = normalizeName(original);
    if (original !== normalized) {
      await db.dbRun(`UPDATE marketing_visits SET location = ? WHERE id = ?`, [normalized, v.id]);
      updatedVisits++;
      console.log(`Visit ${v.id}: "${original}" -> "${normalized}"`);
    }
  }
  console.log(`✅ Updated ${updatedVisits} marketing visit location records.`);

  // 3. Check distinct agent cities
  const finalAgentCities = await db.dbAll(`SELECT city, COUNT(*) as count FROM agents GROUP BY city ORDER BY city COLLATE NOCASE`);
  console.log('\n--- FINAL AGENT CITIES ---');
  console.table(finalAgentCities);

  // 4. Check distinct visit locations
  const finalVisitLocations = await db.dbAll(`SELECT location, COUNT(*) as count FROM marketing_visits GROUP BY location ORDER BY location COLLATE NOCASE`);
  console.log('\n--- FINAL VISIT LOCATIONS ---');
  console.table(finalVisitLocations);

  // 5. Generate fresh liveBackup.json
  console.log('\nExporting fresh unified liveBackup.json...');
  const allAgents = await db.dbAll(`SELECT * FROM agents ORDER BY id ASC`);
  const allVisits = await db.dbAll(`SELECT * FROM marketing_visits ORDER BY id ASC`);
  const allCalls = await db.dbAll(`SELECT * FROM telephonic_calls ORDER BY id ASC`);
  const allQueries = await db.dbAll(`SELECT * FROM queries ORDER BY id ASC`);
  const allTrips = await db.dbAll(`SELECT * FROM field_trips ORDER BY id ASC`);

  const backupData = {
    backed_up_at: new Date().toISOString(),
    agents: allAgents,
    visits: allVisits,
    marketing_visits: allVisits,
    calls: allCalls,
    telephonic_calls: allCalls,
    queries: allQueries,
    field_trips: allTrips
  };

  const backupJson = JSON.stringify(backupData, null, 2);
  const serverBackupPath = path.resolve(__dirname, 'liveBackup.json');
  const rootBackupPath = path.resolve(__dirname, '..', 'liveBackup.json');

  fs.writeFileSync(serverBackupPath, backupJson, 'utf8');
  fs.writeFileSync(rootBackupPath, backupJson, 'utf8');
  console.log(`✅ Written ${serverBackupPath}`);
  console.log(`✅ Written ${rootBackupPath}`);

  // 6. Copy server/travelx.db to root travelx.db
  const serverDbPath = path.resolve(__dirname, 'travelx.db');
  const rootDbPath = path.resolve(__dirname, '..', 'travelx.db');
  fs.copyFileSync(serverDbPath, rootDbPath);
  console.log(`✅ Synchronized root travelx.db with server/travelx.db`);

  console.log('\nAll cleaning and synchronizations complete!');
  process.exit(0);
}

run().catch(err => {
  console.error('Fatal error during cleaning:', err);
  process.exit(1);
});
