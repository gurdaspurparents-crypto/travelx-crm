const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'travelx.db');
const db = new sqlite3.Database(dbPath);

// Promisified DB helpers
const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Initialize Database Schema
async function initDb() {
  db.serialize();

  await dbRun(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      mobile TEXT NOT NULL,
      city TEXT NOT NULL,
      area TEXT NOT NULL,
      agent_type TEXT NOT NULL,
      stage TEXT DEFAULT 'Visited',
      assigned_marketing_exec TEXT,
      assigned_telephonic_exec TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS marketing_visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      visit_date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      executive_name TEXT NOT NULL,
      person_met TEXT,
      mobile TEXT,
      is_new_agent INTEGER DEFAULT 0,
      products_pitched TEXT,
      response_level TEXT NOT NULL,
      remarks TEXT,
      next_followup_date TEXT,
      location TEXT,
      gps_latitude TEXT,
      gps_longitude TEXT,
      gps_address TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  try { await dbRun(`ALTER TABLE marketing_visits ADD COLUMN gps_latitude TEXT`); } catch(e){}
  try { await dbRun(`ALTER TABLE marketing_visits ADD COLUMN gps_longitude TEXT`); } catch(e){}
  try { await dbRun(`ALTER TABLE marketing_visits ADD COLUMN gps_address TEXT`); } catch(e){}

  await dbRun(`
    CREATE TABLE IF NOT EXISTS telephonic_calls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      call_date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      visit_id INTEGER,
      executive_name TEXT NOT NULL,
      is_connected INTEGER DEFAULT 1,
      services_discussed TEXT,
      agent_requirement TEXT,
      interest_level TEXT,
      call_result TEXT NOT NULL,
      remarks TEXT,
      next_followup_date TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS field_trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_date TEXT NOT NULL,
      executive_name TEXT NOT NULL,
      start_meter_reading REAL NOT NULL,
      end_meter_reading REAL,
      start_time TEXT NOT NULL,
      end_time TEXT,
      start_location TEXT,
      end_location TEXT,
      total_km REAL DEFAULT 0,
      rate_per_km REAL DEFAULT 3.0,
      conveyance_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'Ongoing',
      remarks TEXT,
      created_at TEXT NOT NULL
    );
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS queries (
      id TEXT PRIMARY KEY,
      query_date TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      product TEXT NOT NULL,
      query_details TEXT,
      travel_date TEXT,
      pax_details TEXT,
      estimated_value REAL DEFAULT 0,
      quoted_amount REAL DEFAULT 0,
      handling_employee TEXT NOT NULL,
      followup_date TEXT,
      status TEXT DEFAULT 'New',
      booking_date TEXT,
      booking_value REAL DEFAULT 0,
      booking_ref_no TEXT,
      closing_employee TEXT,
      rejection_reason TEXT,
      rejection_remarks TEXT,
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    );
  `);

  // Database initialized clean (0 agents) - user can import their Excel sheet
  console.log('Tables initialized. Database is clean and ready for user Excel import.');
}

// Function to recalculate stage for an agent
async function refreshAgentStage(agentId) {
  const bookings = await dbAll(`SELECT * FROM queries WHERE agent_id = ? AND status = 'Converted'`, [agentId]);
  const queries = await dbAll(`SELECT * FROM queries WHERE agent_id = ?`, [agentId]);
  const calls = await dbAll(`SELECT * FROM telephonic_calls WHERE agent_id = ?`, [agentId]);
  const visits = await dbAll(`SELECT * FROM marketing_visits WHERE agent_id = ?`, [agentId]);

  let newStage = 'Visited';

  if (bookings.length > 0) {
    // Check if dormant (last booking > 30 days ago and no recent queries)
    const latestBookingDate = bookings.map(b => b.booking_date).sort().pop();
    const daysSinceLastBooking = Math.floor((new Date('2026-08-29') - new Date(latestBookingDate)) / (1000 * 60 * 60 * 24));
    if (daysSinceLastBooking > 30) {
      newStage = 'Dormant'; // Previously Active but Now Inactive
    } else {
      newStage = 'Active';
    }
  } else if (queries.length > 0) {
    newStage = 'QueryReceived';
  } else if (calls.some(c => c.is_connected)) {
    newStage = 'Followup';
  } else if (visits.length > 0) {
    newStage = 'Visited';
  } else {
    newStage = 'Inactive';
  }

  await dbRun(`UPDATE agents SET stage = ? WHERE id = ?`, [newStage, agentId]);
  return newStage;
}

// Data Seeder for ~700 agents across Punjab cities
async function seedDatabase() {
  const cities = [
    { city: 'Gurdaspur', areas: ['Main Market', 'Tibri Road', 'Jail Road', 'Gurdaspur Bypass', 'GT Road'] },
    { city: 'Batala', areas: ['Jalandhar Road', 'Shastri Nagar', 'Cinema Road', 'Dera Baba Nanak Road', 'Near Bus Stand'] },
    { city: 'Pathankot', areas: ['Dhangu Road', 'Mission Road', 'Dalhousie Road', 'Model Town', 'Railway Road'] },
    { city: 'Amritsar', areas: ['Ranjit Avenue', 'Lawrence Road', 'GT Road', 'Hall Bazar', 'Mall Road'] },
    { city: 'Jalandhar', areas: ['BMC Chowk', 'Model Town', 'Garha Road', 'LPU Campus Area', 'Nakodar Road'] },
    { city: 'Ludhiana', areas: ['Ferozepur Road', 'Civil Lines', 'Model Town', 'Ghumar Mandi', 'Mall Road'] },
    { city: 'Chandigarh', areas: ['Sector 17', 'Sector 34', 'Sector 22', 'Industrial Area', 'Mohali Phase 7'] }
  ];

  const firstNames = ['Gurpreet', 'Harmandeep', 'Manpreet', 'Rajesh', 'Vikram', 'Amit', 'Sunil', 'Jaswinder', 'Davinder', 'Sanjeev', 'Raman', 'Rohan', 'Karan', 'Simran', 'Pooja', 'Neha', 'Tarun', 'Harpreet', 'Jagdish', 'Ashwani'];
  const lastNames = ['Singh', 'Sharma', 'Verma', 'Kaur', 'Gupta', 'Saini', 'Bhasin', 'Chawla', 'Khosla', 'Thakur', 'Bhatia', 'Kohli', 'Kapoor', 'Seth', 'Gill', 'Sandhu', 'Dhillon', 'Bajwa'];
  const companyPrefixes = ['Royal', 'Globe Trotter', 'Star Air', 'Apex', 'Sky High', 'Golden Temple', 'Speedways', 'North India', 'Punjab Travel', 'Air Wings', 'Fly High', 'Sublime', 'Destination Hub', 'Comfort Tour', 'Express Air', 'Voyage Craft', 'Paradise', 'Universal', 'Blue Sky', 'Omni Travel'];
  const companySuffixes = ['Travels', 'Holidays', 'B2B Solutions', 'Tour & Travels', 'Air Links', 'Travel Desk', 'Ticketing Hub', 'Services', 'Global', 'Express'];
  const agentTypes = ['Retail Travel Agent', 'Flight Specialist', 'Package Specialist', 'Corporate Agent', 'Forex & Visa Agent'];
  const productsList = ['Domestic Flight', 'International Flight', 'Tour Packages', 'Hotel Booking', 'Visa Services', 'Forex', 'Travel Insurance', 'Bus Booking', 'Cruise', 'Money Transfer'];

  const mktExecs = ['Rahul Sharma', 'Vikram Saini', 'Harpreet Singh', 'Amit Kapoor'];
  const teleExecs = ['Pooja Rani', 'Neha Verma', 'Ritu Sharma', 'Priya Bhatia'];

  const agents = [];
  let agentCounter = 1001;

  for (let i = 0; i < 700; i++) {
    const loc = cities[i % cities.length];
    const area = loc.areas[i % loc.areas.length];
    const fname = firstNames[i % firstNames.length];
    const lname = lastNames[(i * 3) % lastNames.length];
    const cPrefix = companyPrefixes[i % companyPrefixes.length];
    const cSuffix = companySuffixes[(i * 2) % companySuffixes.length];
    const company = `${cPrefix} ${cSuffix} (${loc.city})`;
    const mobile = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const agentId = `AGT-${agentCounter++}`;
    const agentType = agentTypes[i % agentTypes.length];
    const mktExec = mktExecs[i % mktExecs.length];
    const teleExec = teleExecs[i % teleExecs.length];

    agents.push({
      id: agentId,
      name: `${fname} ${lname}`,
      company_name: company,
      mobile: mobile,
      city: loc.city,
      area: area,
      agent_type: agentType,
      stage: 'Visited',
      assigned_marketing_exec: mktExec,
      assigned_telephonic_exec: teleExec,
      created_at: '2026-07-01'
    });
  }

  // Insert agents in batch
  for (const ag of agents) {
    await dbRun(
      `INSERT INTO agents (id, name, company_name, mobile, city, area, agent_type, stage, assigned_marketing_exec, assigned_telephonic_exec, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ag.id, ag.name, ag.company_name, ag.mobile, ag.city, ag.area, ag.agent_type, ag.stage, ag.assigned_marketing_exec, ag.assigned_telephonic_exec, ag.created_at]
    );
  }

  console.log('Inserted 700 Agents!');

  // Now create sample visit, call, query, and booking histories to reflect realistic proportions:
  // Out of 700 agents:
  // ~450 visited
  // ~380 follow-up calls done
  // ~210 queries received
  // ~110 active converted agents
  // ~40 query but no booking
  // ~130 visited but no query
  // ~30 dormant (previously active)

  let queryCounter = 5001;

  for (let i = 0; i < 700; i++) {
    const ag = agents[i];

    // Marketing Visit for ~480 agents
    if (i < 480) {
      const visitDate = `2026-08-${String((i % 25) + 1).padStart(2, '0')}`;
      const respLevels = ['Very Interested / Hot', 'Interested / Warm', 'Not Very Interested / Cold', 'Not Interested'];
      const resp = respLevels[i % respLevels.length];
      const pitched = JSON.stringify([productsList[i % productsList.length], productsList[(i + 3) % productsList.length]]);

      const visitRes = await dbRun(
        `INSERT INTO marketing_visits (visit_date, agent_id, executive_name, person_met, mobile, is_new_agent, products_pitched, response_level, remarks, next_followup_date, location)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          visitDate,
          ag.id,
          ag.assigned_marketing_exec,
          ag.name,
          ag.mobile,
          i < 50 ? 1 : 0,
          pitched,
          resp,
          `Agent requested competitive B2B rates for ${productsList[i % productsList.length]}. Met at office.`,
          `2026-08-${String(((i % 25) + 2)).padStart(2, '0')}`,
          ag.city
        ]
      );
      const visitId = visitRes.lastID;

      // Telephonic Call for ~390 agents
      if (i < 390) {
        const callDate = `2026-08-${String(((i % 25) + 2)).padStart(2, '0')}`;
        const isConnected = i % 10 !== 0 ? 1 : 0;
        const callResults = ['Requirement Received', 'Interested', 'Follow-up Required', 'No Response', 'Call Again Later'];
        const callResult = isConnected ? callResults[i % callResults.length] : 'No Response';

        await dbRun(
          `INSERT INTO telephonic_calls (call_date, agent_id, visit_id, executive_name, is_connected, services_discussed, agent_requirement, interest_level, call_result, remarks, next_followup_date)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            callDate,
            ag.id,
            visitId,
            ag.assigned_telephonic_exec,
            isConnected,
            pitched,
            isConnected && i < 220 ? `Urgent requirement for 4 pax Dubai package + visa` : 'General discussion',
            resp,
            callResult,
            isConnected ? 'Agent asked for customized quote' : 'Phone ringing, no answer',
            `2026-08-${String(((i % 25) + 4)).padStart(2, '0')}`
          ]
        );
      }

      // Queries for ~220 agents
      if (i < 220) {
        const queryDate = `2026-08-${String(((i % 20) + 5)).padStart(2, '0')}`;
        const prod = productsList[i % productsList.length];
        const estVal = 25000 + (i % 15) * 8000;
        const qtrVal = estVal - 1000;
        const qryId = `QRY-${queryCounter++}`;

        // Status distribution:
        // Converted for i < 120
        // Rejected/Lost for 120 <= i < 170
        // Pending/Quoted for 170 <= i < 220
        let status = 'Pending';
        let bookingDate = null;
        let bookingVal = 0;
        let bookingRef = null;
        let rejReason = null;
        let rejRemarks = null;

        if (i < 120) {
          status = 'Converted';
          // Make some converted older (> 30 days) to simulate dormant active agents
          bookingDate = i < 30 ? `2026-06-${String((i % 25) + 1).padStart(2, '0')}` : `2026-08-${String(((i % 15) + 10)).padStart(2, '0')}`;
          bookingVal = qtrVal;
          bookingRef = `BK-2026-${1000 + i}`;
        } else if (i < 170) {
          status = i % 2 === 0 ? 'Rejected' : 'Lost';
          const reasons = ['Price', 'Competitor Rate', 'Customer Cancelled', 'Agent Did Not Respond', 'Customer Did Not Confirm', 'Product Not Available'];
          rejReason = reasons[i % reasons.length];
          rejRemarks = `Agent found lower price with competitor local wholesaler.`;
        } else {
          status = i % 2 === 0 ? 'Quoted' : 'Follow-up';
        }

        await dbRun(
          `INSERT INTO queries (id, query_date, agent_id, product, query_details, travel_date, pax_details, estimated_value, quoted_amount, handling_employee, followup_date, status, booking_date, booking_value, booking_ref_no, closing_employee, rejection_reason, rejection_remarks)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            qryId,
            queryDate,
            ag.id,
            prod,
            `${prod} for 2 adults, 1 child. Preferred date mid next month.`,
            '2026-09-15',
            '2 Adults, 1 Child',
            estVal,
            qtrVal,
            ag.assigned_telephonic_exec,
            '2026-08-30',
            status,
            bookingDate,
            bookingVal,
            bookingRef,
            status === 'Converted' ? ag.assigned_telephonic_exec : null,
            rejReason,
            rejRemarks
          ]
        );
      }
    }

    // Refresh agent stage based on inserted data
    await refreshAgentStage(ag.id);
  }

  console.log('Seeded complete Travelx CRM database successfully!');
}

module.exports = {
  db,
  dbRun,
  dbAll,
  dbGet,
  initDb,
  refreshAgentStage
};
