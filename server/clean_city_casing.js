const db = require('./db');

function toTitleCase(str) {
  if (!str) return str;
  return str
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function cleanCityCasing() {
  console.log('Cleaning city capitalization & casing mismatches...');

  // 1. Fetch all distinct cities
  const rows = await db.dbAll(`SELECT DISTINCT city FROM agents WHERE city IS NOT NULL AND city != ''`);

  let updatedCount = 0;

  // Manual specific mapping overrides for abbreviations / specific spellings
  const customOverrides = {
    'gunopur': 'Gunopur',
    'jail rd': 'Jail Road',
    'jail rd ': 'Jail Road',
    'jakholari': 'Jahkolri',
    'old bus stnd': 'Old Bus Stand',
    'old bus stnd ': 'Old Bus Stand',
    'nikke ghuman': 'Nikke Ghuman',
    'nikke ghuman ghumani': 'Nikke Ghuman',
    'mag.rd': 'Mag. Road',
    'beant clg near': 'Near Beant College',
    'bhaini mia khan': 'Bhaini Mia Khan',
    'sathali': 'Sathiali',
  };

  for (const r of rows) {
    const rawCity = r.city;
    const trimmedLower = rawCity.trim().toLowerCase();

    let targetCity = customOverrides[trimmedLower] || toTitleCase(rawCity);

    if (rawCity !== targetCity) {
      console.log(`Fixing: "${rawCity}" -> "${targetCity}"`);
      const res = await db.dbRun(`UPDATE agents SET city = ? WHERE city = ?`, [targetCity, rawCity]);
      updatedCount += res.changes;
    }
  }

  // Group and capitalize all remaining entries
  const allCities = await db.dbAll(`SELECT DISTINCT city FROM agents WHERE city IS NOT NULL AND city != ''`);
  for (const r of allCities) {
    const titleCased = toTitleCase(r.city);
    if (r.city !== titleCased) {
      const res = await db.dbRun(`UPDATE agents SET city = ? WHERE city = ?`, [titleCased, r.city]);
      updatedCount += res.changes;
    }
  }

  console.log(`✅ Capitalization cleanup finished! Total records updated: ${updatedCount}`);

  // Fetch final distinct city list
  const finalCities = await db.dbAll(`SELECT DISTINCT city, COUNT(*) as count FROM agents GROUP BY city ORDER BY city ASC`);
  console.log('\nFinal Distinct Cleaned Cities List:');
  console.table(finalCities);

  process.exit(0);
}

cleanCityCasing().catch(err => {
  console.error(err);
  process.exit(1);
});
