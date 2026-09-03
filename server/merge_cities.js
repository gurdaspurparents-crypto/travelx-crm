const db = require('./db');

async function mergeCities() {
  console.log('Merging cities in Travelx CRM database...');

  // 1. Amipur (Amipur + amipur + Ammipur)
  const r1 = await db.dbRun(`UPDATE agents SET city = 'Amipur' WHERE LOWER(TRIM(city)) IN ('amipur', 'ammipur')`);
  console.log('Amipur updated agents:', r1.changes);

  // 2. Behrampur (Behrampur + behrampur)
  const r2 = await db.dbRun(`UPDATE agents SET city = 'Behrampur' WHERE LOWER(TRIM(city)) = 'behrampur'`);
  console.log('Behrampur updated agents:', r2.changes);

  // 3. Bhaini mia khan (Bhaini mia khan + bhaini mia khan)
  const r3 = await db.dbRun(`UPDATE agents SET city = 'Bhaini mia khan' WHERE LOWER(TRIM(city)) = 'bhaini mia khan'`);
  console.log('Bhaini mia khan updated agents:', r3.changes);

  // 4. Dinanagar (Dinanagar + dnn)
  const r4 = await db.dbRun(`UPDATE agents SET city = 'Dinanagar' WHERE LOWER(TRIM(city)) IN ('dinanagar', 'dnn')`);
  console.log('Dinanagar updated agents:', r4.changes);

  // 5. Kalanour (Kalanaur + Kalanour -> Kalanour)
  const r5 = await db.dbRun(`UPDATE agents SET city = 'Kalanour' WHERE LOWER(TRIM(city)) IN ('kalanaur', 'kalanour')`);
  console.log('Kalanour updated agents:', r5.changes);

  // 6. Kot Santokh Rai (Kot Santokh Rai + Kot santokh rai)
  const r6 = await db.dbRun(`UPDATE agents SET city = 'Kot Santokh Rai' WHERE LOWER(TRIM(city)) = 'kot santokh rai'`);
  console.log('Kot Santokh Rai updated agents:', r6.changes);

  // Additional casing/spacing cleanups
  await db.dbRun(`UPDATE agents SET city = 'Naranwali' WHERE LOWER(TRIM(city)) = 'naranwali'`);
  await db.dbRun(`UPDATE agents SET city = 'Qadian' WHERE LOWER(TRIM(city)) = 'qadian'`);
  await db.dbRun(`UPDATE agents SET city = 'Taragarh' WHERE LOWER(TRIM(city)) = 'taragarh'`);
  await db.dbRun(`UPDATE agents SET city = 'Naushera Majha Singh' WHERE LOWER(TRIM(city)) = 'nushera majha singh'`);
  await db.dbRun(`UPDATE agents SET city = 'Sri Hargobindpur' WHERE LOWER(TRIM(city)) = 'shri hargobindpur'`);
  await db.dbRun(`UPDATE agents SET city = 'Seikhwan' WHERE LOWER(TRIM(city)) = 'sekhwan'`);

  console.log('✅ All city merges completed successfully!');

  const updatedCities = await db.dbAll(`SELECT DISTINCT city, COUNT(*) as count FROM agents WHERE city IN ('Amipur', 'Behrampur', 'Bhaini mia khan', 'Dinanagar', 'Kalanour', 'Kot Santokh Rai') GROUP BY city ORDER BY city ASC`);
  console.log('Updated targeted city counts:');
  console.table(updatedCities);

  process.exit(0);
}

mergeCities().catch(err => {
  console.error('Error merging cities:', err);
  process.exit(1);
});
