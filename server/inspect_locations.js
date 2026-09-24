const db = require('./db');

async function testLocDiff() {
  // Query 1: What /api/analytics/location uses:
  // GROUP BY TRIM(LOWER(a.city))
  const matrixGsp = await db.dbAll(`
    SELECT id, name, company_name, city, area 
    FROM agents 
    WHERE TRIM(LOWER(city)) = 'gurdaspur'
  `);
  console.log('Matrix Gurdaspur count (city = Gurdaspur):', matrixGsp.length);

  // Query 2: What /api/agents?location=Gurdaspur uses:
  // WHERE a.city LIKE '%Gurdaspur%' OR a.area LIKE '%Gurdaspur%'
  const checklistGsp = await db.dbAll(`
    SELECT id, name, company_name, city, area 
    FROM agents 
    WHERE city LIKE '%Gurdaspur%' OR area LIKE '%Gurdaspur%'
  `);
  console.log('Checklist Gurdaspur count (city LIKE or area LIKE):', checklistGsp.length);

  // What is the difference?
  const matrixIds = new Set(matrixGsp.map(a => a.id));
  const checklistIds = new Set(checklistGsp.map(a => a.id));

  const inChecklistNotMatrix = checklistGsp.filter(a => !matrixIds.has(a.id));
  const inMatrixNotChecklist = matrixGsp.filter(a => !checklistIds.has(a.id));

  console.log('In Checklist but NOT in Matrix:', inChecklistNotMatrix);
  console.log('In Matrix but NOT in Checklist:', inMatrixNotChecklist);

  process.exit(0);
}

testLocDiff().catch(err => {
  console.error(err);
  process.exit(1);
});
