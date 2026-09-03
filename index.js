const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const XLSX = require('xlsx');
const { db, dbRun, dbAll, dbGet, initDb, refreshAgentStage } = require('./db');
const { restoreFromGitHub, scheduleBackup } = require('./gitBackup');

const app = express();
const PORT = process.env.PORT || 5000;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// Serve static frontend in production
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname, '../dist')));
app.use(express.static(path.join(__dirname, 'client/dist')));
app.use(express.static(path.join(__dirname, '../client/dist')));

// Explicit root route - always serve latest compiled React app
app.get('/', (req, res) => {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  const parentDistIndex = path.join(__dirname, '../dist', 'index.html');
  const clientDistIndex = path.join(__dirname, 'client', 'dist', 'index.html');
  if (fs.existsSync(distIndex)) return res.sendFile(distIndex);
  if (fs.existsSync(parentDistIndex)) return res.sendFile(parentDistIndex);
  if (fs.existsSync(clientDistIndex)) return res.sendFile(clientDistIndex);
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Travelx CRM</title></head><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px"><h1>✈️ Travelx CRM</h1><p>Loading...</p></body></html>`);
});

// Initialize DB schema & seed data, then restore live data from GitHub backup
initDb().then(async () => {
  console.log('Database initialized successfully.');
  // Restore latest live data from GitHub (overrides seedData with latest entries)
  await restoreFromGitHub(db, dbRun, dbAll);
}).catch(err => {
  console.error('Failed to initialize database:', err);
});

// ==================== 1. EXCEL / CSV IMPORT & DATA MANAGEMENT ====================

// Sample Template Download
app.get('/api/agents/sample-template', (req, res) => {
  try {
    const sampleData = [
      {
        "Agent ID": "AGT-1001",
        "Company Name": "Royal Travels & Holidays",
        "Contact Person": "Gurpreet Singh",
        "Mobile": "9876543210",
        "City": "Gurdaspur",
        "Area": "Main Market",
        "Agent Type": "Retail Travel Agent",
        "Assigned Marketing Exec": "Bikramjit Singh",
        "Assigned Telephonic Exec": "Simranjit Kaur"
      },
      {
        "Agent ID": "AGT-1002",
        "Company Name": "Globe Trotter B2B",
        "Contact Person": "Rajesh Sharma",
        "Mobile": "9812345678",
        "City": "Batala",
        "Area": "Jalandhar Road",
        "Agent Type": "Flight Specialist",
        "Assigned Marketing Exec": "Bikramjit Singh",
        "Assigned Telephonic Exec": "Simranjit Kaur"
      },
      {
        "Agent ID": "AGT-1003",
        "Company Name": "Star Air Holidays",
        "Contact Person": "Harmandeep Kaur",
        "Mobile": "9898989898",
        "City": "Pathankot",
        "Area": "Dhangu Road",
        "Agent Type": "Package Specialist",
        "Assigned Marketing Exec": "Bikramjit Singh",
        "Assigned Telephonic Exec": "Simranjit Kaur"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agents Template");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Travelx_Agents_Import_Template.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to generate next unique Agent ID based on max existing numeric ID
async function getNextAgentId() {
  const rows = await dbAll(`SELECT id FROM agents`);
  let maxNum = 1000;
  for (const r of rows) {
    const num = parseInt((r.id || '').replace(/\D/g, ''));
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  return `AGT-${maxNum + 1}`;
}

// Import Excel or CSV file
app.post('/api/agents/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const workbook = req.file.buffer
      ? XLSX.read(req.file.buffer, { type: 'buffer' })
      : XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

    let importedCount = 0;
    const allRows = await dbAll(`SELECT id FROM agents`);
    let maxNum = 1000;
    for (const r of allRows) {
      const num = parseInt((r.id || '').replace(/\D/g, ''));
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    let nextIdCounter = maxNum + 1;

    for (const row of sheetData) {
      const companyName = row['Company Name'] || row['Firm Name'] || row['Agency Name'] || row['Company'] || row['company_name'] || 'Travel Agency';
      const name = row['Contact Person'] || row['Agent Name'] || row['Name'] || row['name'] || 'Contact Person';
      const mobile = String(row['Mobile'] || row['Phone'] || row['Mobile Number'] || row['mobile'] || '9800000000');
      const city = row['City'] || row['Location'] || row['city'] || 'Gurdaspur';
      const area = row['Area'] || row['area'] || 'Main Market';
      const agentType = row['Agent Type'] || row['Type'] || row['agent_type'] || 'Retail Travel Agent';
      const mktExec = row['Assigned Marketing Exec'] || row['Marketing Exec'] || row['assigned_marketing_exec'] || 'Bikramjit Singh';
      const teleExec = row['Assigned Telephonic Exec'] || row['Telephonic Exec'] || row['assigned_telephonic_exec'] || 'Simranjit Kaur';
      const agentId = row['Agent ID'] || row['ID'] || `AGT-${nextIdCounter++}`;
      const stage = row['Stage'] || row['Status'] || 'Inactive';
      const createdAt = new Date().toISOString().split('T')[0];

      await dbRun(
        `INSERT OR REPLACE INTO agents (id, name, company_name, mobile, city, area, agent_type, stage, assigned_marketing_exec, assigned_telephonic_exec, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [agentId, name, companyName, mobile, city, area, agentType, stage, mktExec, teleExec, createdAt]
      );
      importedCount++;
    }

    res.json({ success: true, count: importedCount, message: `Successfully imported ${importedCount} agents into Master Database!` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear all database agents
app.post('/api/agents/clear', async (req, res) => {
  try {
    await dbRun(`DELETE FROM queries`);
    await dbRun(`DELETE FROM telephonic_calls`);
    await dbRun(`DELETE FROM marketing_visits`);
    await dbRun(`DELETE FROM agents`);
    res.json({ success: true, message: 'All database records cleared! You can now import your 700+ agents list from Excel.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 2. AGENT MASTER ENDPOINTS ====================

// List agents with search, filter, and pagination
app.get('/api/agents', async (req, res) => {
  try {
    const { search, city, stage, agent_type, exec, visit_from_date, visit_to_date, limit = 100, offset = 0 } = req.query;

    const mvWhere = [];
    const mvParams = [];
    if (visit_from_date) {
      mvWhere.push(`mv1.visit_date >= ?`);
      mvParams.push(visit_from_date);
    }
    if (visit_to_date) {
      mvWhere.push(`mv1.visit_date <= ?`);
      mvParams.push(visit_to_date);
    }

    const mvJoinClause = mvWhere.length > 0
      ? `LEFT JOIN (
          SELECT agent_id, MAX(visit_date) as visit_date
          FROM marketing_visits mv1
          WHERE ${mvWhere.join(' AND ')}
          GROUP BY agent_id
        ) mv ON a.id = mv.agent_id`
      : `LEFT JOIN marketing_visits mv ON a.id = mv.agent_id`;

    let query = `
      SELECT a.*,
             COUNT(DISTINCT q.id) as total_queries,
             COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.id END) as total_bookings,
             COALESCE(SUM(CASE WHEN q.status = 'Converted' THEN q.booking_value ELSE 0 END), 0) as total_business_value,
             MAX(mv.visit_date) as last_visit_date,
             MAX(tc.call_date) as last_call_date,
             MAX(q.query_date) as last_query_date,
             MAX(CASE WHEN q.status = 'Converted' THEN q.booking_date END) as last_booking_date
      FROM agents a
      ${mvJoinClause}
      LEFT JOIN telephonic_calls tc ON a.id = tc.agent_id
      LEFT JOIN queries q ON a.id = q.agent_id
      WHERE 1=1
    `;
    const params = [...mvParams];

    if (search) {
      query += ` AND (a.name LIKE ? OR a.company_name LIKE ? OR a.mobile LIKE ? OR a.id LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (city) {
      query += ` AND (a.city = ? OR a.area = ?)`;
      params.push(city, city);
    }

    const { location } = req.query;
    if (location) {
      query += ` AND (a.city LIKE ? OR a.area LIKE ?)`;
      const loc = `%${location}%`;
      params.push(loc, loc);
    }

    if (stage) {
      if (stage === 'Visited') {
        query += ` AND (a.stage = 'Visited' AND a.id IN (SELECT DISTINCT agent_id FROM marketing_visits))`;
      } else if (stage === 'Inactive') {
        query += ` AND (a.stage = 'Inactive' OR (a.id NOT IN (SELECT DISTINCT agent_id FROM marketing_visits) AND a.id NOT IN (SELECT DISTINCT agent_id FROM queries)))`;
      } else {
        query += ` AND a.stage = ?`;
        params.push(stage);
      }
    }

    if (agent_type) {
      query += ` AND a.agent_type = ?`;
      params.push(agent_type);
    }

    if (exec) {
      query += ` AND (a.assigned_marketing_exec = ? OR a.assigned_telephonic_exec = ?)`;
      params.push(exec, exec);
    }

    query += ` GROUP BY a.id ORDER BY a.id ASC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const agents = await dbAll(query, params);

    // Get total count for pagination
    let countQuery = `SELECT COUNT(*) as total FROM agents WHERE 1=1`;
    const countParams = [];
    if (search) {
      countQuery += ` AND (name LIKE ? OR company_name LIKE ? OR mobile LIKE ? OR id LIKE ?)`;
      const s = `%${search}%`;
      countParams.push(s, s, s, s);
    }
    if (city) {
      countQuery += ` AND (city = ? OR area = ?)`;
      countParams.push(city, city);
    }
    if (location) {
      countQuery += ` AND (city LIKE ? OR area LIKE ?)`;
      const loc = `%${location}%`;
      countParams.push(loc, loc);
    }
    if (stage) {
      if (stage === 'Visited') {
        countQuery += ` AND (stage = 'Visited' AND id IN (SELECT DISTINCT agent_id FROM marketing_visits))`;
      } else if (stage === 'Inactive') {
        countQuery += ` AND (stage = 'Inactive' OR (id NOT IN (SELECT DISTINCT agent_id FROM marketing_visits) AND id NOT IN (SELECT DISTINCT agent_id FROM queries)))`;
      } else {
        countQuery += ` AND stage = ?`;
        countParams.push(stage);
      }
    }

    const { total } = await dbGet(countQuery, countParams);

    res.json({ success: true, agents, total });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to fetch dynamic distinct cities and areas from imported agents DB
app.get('/api/agents/locations', async (req, res) => {
  try {
    const rawCities = await dbAll(`SELECT DISTINCT city FROM agents WHERE city IS NOT NULL AND city != '' ORDER BY city ASC`);
    const rawAreas = await dbAll(`SELECT DISTINCT area FROM agents WHERE area IS NOT NULL AND area != '' ORDER BY area ASC`);

    function toTitleCase(str) {
      if (!str) return '';
      return str.trim().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }

    const citiesSet = new Set();
    rawCities.forEach(c => {
      const clean = toTitleCase(c.city);
      if (clean) citiesSet.add(clean);
    });

    const areasSet = new Set();
    rawAreas.forEach(a => {
      const clean = toTitleCase(a.area);
      if (clean) areasSet.add(clean);
    });

    res.json({
      success: true,
      cities: Array.from(citiesSet).sort((a, b) => a.localeCompare(b)),
      areas: Array.from(areasSet).sort((a, b) => a.localeCompare(b))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get 360 Agent Profile Details
app.get('/api/agents/:id', async (req, res) => {
  try {
    const agent = await dbGet(`SELECT * FROM agents WHERE id = ?`, [req.params.id]);
    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const visits = await dbAll(`SELECT * FROM marketing_visits WHERE agent_id = ? ORDER BY visit_date DESC`, [agent.id]);
    const calls = await dbAll(`SELECT * FROM telephonic_calls WHERE agent_id = ? ORDER BY call_date DESC`, [agent.id]);
    const queries = await dbAll(`SELECT * FROM queries WHERE agent_id = ? ORDER BY query_date DESC`, [agent.id]);
    const bookings = queries.filter(q => q.status === 'Converted');

    const totalBusinessValue = bookings.reduce((sum, b) => sum + (b.booking_value || 0), 0);

    res.json({
      success: true,
      agent: {
        ...agent,
        visits,
        calls,
        queries,
        bookings,
        total_queries: queries.length,
        total_bookings: bookings.length,
        total_business_value: totalBusinessValue
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Create new Agent
app.post('/api/agents', async (req, res) => {
  try {
    const { name, company_name, mobile, city, area, agent_type, assigned_marketing_exec, assigned_telephonic_exec } = req.body;

    const nextId = await getNextAgentId();
    const createdAt = new Date().toISOString().split('T')[0];

    await dbRun(
      `INSERT INTO agents (id, name, company_name, mobile, city, area, agent_type, stage, assigned_marketing_exec, assigned_telephonic_exec, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Inactive', ?, ?, ?)`,
      [nextId, name, company_name, mobile, city, area, agent_type, assigned_marketing_exec || 'Bikramjit Singh', assigned_telephonic_exec || 'Simranjit Kaur', createdAt]
    );

    res.json({ success: true, message: 'Agent created successfully', agent_id: nextId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Agent details
app.put('/api/agents/:id', async (req, res) => {
  try {
    const { name, company_name, mobile, city, area, agent_type, assigned_marketing_exec, assigned_telephonic_exec } = req.body;
    const agentId = req.params.id;

    await dbRun(
      `UPDATE agents
       SET name = ?, company_name = ?, mobile = ?, city = ?, area = ?, agent_type = ?,
           assigned_marketing_exec = COALESCE(?, assigned_marketing_exec),
           assigned_telephonic_exec = COALESCE(?, assigned_telephonic_exec)
       WHERE id = ?`,
      [name, company_name, mobile, city, area, agent_type, assigned_marketing_exec, assigned_telephonic_exec, agentId]
    );

    res.json({ success: true, message: 'Agent details updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Agent
app.delete('/api/agents/:id', async (req, res) => {
  try {
    const agentId = req.params.id;
    await dbRun(`DELETE FROM queries WHERE agent_id = ?`, [agentId]);
    await dbRun(`DELETE FROM telephonic_calls WHERE agent_id = ?`, [agentId]);
    await dbRun(`DELETE FROM marketing_visits WHERE agent_id = ?`, [agentId]);
    await dbRun(`DELETE FROM agents WHERE id = ?`, [agentId]);
    res.json({ success: true, message: 'Agent deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 2. STAGE 1 - MARKETING VISITS ====================

app.get('/api/visits', async (req, res) => {
  try {
    const { executive, city, date, from_date, to_date } = req.query;
    let query = `
      SELECT mv.*, a.name as agent_name, a.company_name, a.city as agent_city, a.mobile as agent_mobile
      FROM marketing_visits mv
      JOIN agents a ON mv.agent_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (executive) {
      query += ` AND mv.executive_name = ?`;
      params.push(executive);
    }
    if (city) {
      query += ` AND a.city = ?`;
      params.push(city);
    }
    if (date) {
      query += ` AND mv.visit_date = ?`;
      params.push(date);
    }
    if (from_date) {
      query += ` AND mv.visit_date >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND mv.visit_date <= ?`;
      params.push(to_date);
    }

    query += ` ORDER BY mv.visit_date DESC, mv.id DESC LIMIT 150`;

    const visits = await dbAll(query, params);
    res.json({ success: true, visits });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Visited Agents Queue for Telephonic Follow-up (Bikramjit Field Visits Queue for Simranjit Next-Day Feedback)
app.get('/api/visits/pending-followup', async (req, res) => {
  try {
    const queue = await dbAll(`
      SELECT 
        mv.id as visit_id,
        mv.visit_date,
        mv.executive_name as visited_by,
        mv.person_met,
        mv.mobile as contact_mobile,
        mv.products_pitched,
        mv.response_level,
        mv.remarks as visit_remarks,
        mv.gps_latitude,
        mv.gps_longitude,
        a.id as agent_id,
        a.company_name,
        a.city as agent_city,
        a.area as agent_area,
        tc.id as call_id,
        tc.call_date,
        tc.call_result,
        tc.remarks as call_feedback,
        tc.next_followup_date
      FROM marketing_visits mv
      JOIN agents a ON mv.agent_id = a.id
      LEFT JOIN telephonic_calls tc ON mv.id = tc.visit_id
      ORDER BY mv.visit_date DESC, mv.id DESC
      LIMIT 150
    `);
    res.json({ success: true, queue });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Territory Location Coverage & Agent Visit Status (Bikramjit Visited vs Unvisited Breakdown for Simranjit)
app.get('/api/location-coverage', async (req, res) => {
  try {
    const { city, filter } = req.query;
    
    const citiesRaw = await dbAll(`SELECT DISTINCT city FROM agents WHERE city IS NOT NULL AND city != '' ORDER BY city ASC`);
    const citiesList = citiesRaw.map(c => c.city);

    const selectedCity = city || citiesList[0] || 'Gurdaspur';

    let sql = `
      SELECT 
        a.id as agent_id,
        a.company_name,
        a.name as contact_person,
        a.mobile,
        a.city,
        a.area,
        a.agent_type,
        a.stage,
        mv.id as visit_id,
        mv.visit_date,
        mv.person_met,
        mv.products_pitched,
        mv.response_level,
        mv.remarks as visit_remarks,
        tc.id as call_id,
        tc.call_date,
        tc.call_result,
        tc.remarks as call_remarks
      FROM agents a
      LEFT JOIN (
        SELECT mv1.* FROM marketing_visits mv1
        INNER JOIN (
          SELECT agent_id, MAX(id) as max_id FROM marketing_visits GROUP BY agent_id
        ) mv2 ON mv1.id = mv2.max_id
      ) mv ON a.id = mv.agent_id
      LEFT JOIN (
        SELECT tc1.* FROM telephonic_calls tc1
        INNER JOIN (
          SELECT agent_id, MAX(id) as max_id FROM telephonic_calls GROUP BY agent_id
        ) tc2 ON tc1.id = tc2.max_id
      ) tc ON a.id = tc.agent_id
      WHERE a.city = ?
    `;

    const params = [selectedCity];

    if (filter === 'visited') {
      sql += ` AND mv.id IS NOT NULL`;
    } else if (filter === 'unvisited') {
      sql += ` AND mv.id IS NULL`;
    }

    sql += ` ORDER BY mv.id DESC, a.company_name ASC`;

    const agentsList = await dbAll(sql, params);

    const stats = await dbGet(`
      SELECT 
        COUNT(DISTINCT a.id) as total_agents,
        COUNT(DISTINCT mv.agent_id) as visited_agents,
        (COUNT(DISTINCT a.id) - COUNT(DISTINCT mv.agent_id)) as unvisited_agents
      FROM agents a
      LEFT JOIN marketing_visits mv ON a.id = mv.agent_id
      WHERE a.city = ?
    `, [selectedCity]);

    res.json({
      success: true,
      selectedCity,
      cities: citiesList,
      stats: stats || { total_agents: 0, visited_agents: 0, unvisited_agents: 0 },
      agents: agentsList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/visits', async (req, res) => {
  try {
    const { visit_date, agent_id, executive_name, person_met, mobile, is_new_agent, products_pitched, response_level, remarks, next_followup_date, location, gps_latitude, gps_longitude, gps_address } = req.body;

    const pitchedJson = Array.isArray(products_pitched) ? JSON.stringify(products_pitched) : products_pitched;

    const result = await dbRun(
      `INSERT INTO marketing_visits (visit_date, agent_id, executive_name, person_met, mobile, is_new_agent, products_pitched, response_level, remarks, next_followup_date, location, gps_latitude, gps_longitude, gps_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [visit_date, agent_id, executive_name, person_met, mobile, is_new_agent ? 1 : 0, pitchedJson, response_level, remarks, next_followup_date, location, gps_latitude || null, gps_longitude || null, gps_address || null]
    );

    // Update agent stage
    await refreshAgentStage(agent_id);

    // Auto-backup to GitHub so data survives redeploys
    scheduleBackup(db);

    res.json({ success: true, id: result.lastID, message: 'Marketing visit logged successfully with GPS verification' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Marketing Visit
app.delete('/api/visits/:id', async (req, res) => {
  try {
    const visit = await dbGet(`SELECT agent_id FROM marketing_visits WHERE id = ?`, [req.params.id]);
    await dbRun(`DELETE FROM marketing_visits WHERE id = ?`, [req.params.id]);
    if (visit) {
      await refreshAgentStage(visit.agent_id);
    }
    res.json({ success: true, message: 'Marketing visit log deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== FIELD TRIP & CONVEYANCE TRACKING ROUTES ====================

app.get('/api/field-trips', async (req, res) => {
  try {
    const { executive, date } = req.query;
    let query = `SELECT * FROM field_trips WHERE 1=1`;
    const params = [];
    if (executive) {
      query += ` AND executive_name = ?`;
      params.push(executive);
    }
    if (date) {
      query += ` AND trip_date = ?`;
      params.push(date);
    }
    query += ` ORDER BY trip_date DESC, id DESC LIMIT 100`;

    const trips = await dbAll(query, params);
    res.json({ success: true, trips });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/field-trips/report', async (req, res) => {
  try {
    const rawReport = await dbAll(`
      SELECT 
        trip_date,
        executive_name,
        MIN(start_meter_reading) as day_start_km,
        MAX(end_meter_reading) as day_end_km,
        MAX(rate_per_km) as rate_per_km,
        COUNT(id) as total_trips
      FROM field_trips
      WHERE status = 'Completed' OR end_meter_reading IS NOT NULL
      GROUP BY trip_date, executive_name
      ORDER BY trip_date DESC
    `);

    const report = rawReport.map(r => {
      const start = parseFloat(r.day_start_km || 0);
      const end = parseFloat(r.day_end_km || 0);
      const rate = parseFloat(r.rate_per_km || 3.0);
      const totalKm = Math.max(0, end - start);
      const totalConveyance = Math.round(totalKm * rate);

      return {
        ...r,
        total_day_km: totalKm,
        total_day_conveyance: totalConveyance
      };
    });

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/field-trips/start', async (req, res) => {
  try {
    const { trip_date, executive_name, start_meter_reading, start_location, rate_per_km, remarks } = req.body;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const createdAt = new Date().toISOString();

    const result = await dbRun(
      `INSERT INTO field_trips (trip_date, executive_name, start_meter_reading, start_time, start_location, rate_per_km, status, remarks, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'Ongoing', ?, ?)`,
      [trip_date || new Date().toISOString().split('T')[0], executive_name || 'Bikramjit Singh', parseFloat(start_meter_reading), nowTime, start_location || 'Office Departure', parseFloat(rate_per_km || 3.0), remarks || '', createdAt]
    );

    res.json({ success: true, id: result.lastID, message: '🏍️ Field trip started successfully! Start Meter Reading logged.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/field-trips/end/:id', async (req, res) => {
  try {
    const tripId = req.params.id;
    const { end_meter_reading, end_location, remarks } = req.body;
    const trip = await dbGet(`SELECT * FROM field_trips WHERE id = ?`, [tripId]);

    if (!trip) {
      return res.status(404).json({ success: false, error: 'Trip record not found' });
    }

    const startKM = parseFloat(trip.start_meter_reading);
    const endKM = parseFloat(end_meter_reading);
    const totalKM = Math.max(0, endKM - startKM);
    const rate = parseFloat(trip.rate_per_km || 3.0);
    const conveyance = Math.round(totalKM * rate);
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    await dbRun(
      `UPDATE field_trips
       SET end_meter_reading = ?, end_time = ?, end_location = ?, total_km = ?, conveyance_amount = ?, status = 'Completed', remarks = COALESCE(NULLIF(?, ''), remarks)
       WHERE id = ?`,
      [endKM, nowTime, end_location || 'Office Return', totalKM, conveyance, remarks || '', tripId]
    );

    res.json({
      success: true,
      total_km: totalKM,
      conveyance_amount: conveyance,
      message: `🏁 Trip ended! Total distance: ${totalKM} KM. Conveyance Allowance: ₹${conveyance}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/field-trips/clear-all', async (req, res) => {
  try {
    await dbRun(`DELETE FROM field_trips`);
    res.json({ success: true, message: 'All conveyance trip logs cleared successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/field-trips/:id', async (req, res) => {
  try {
    const { start_meter_reading, end_meter_reading, rate_per_km, remarks } = req.body;
    const startKM = parseFloat(start_meter_reading || 0);
    const endKM = parseFloat(end_meter_reading || 0);
    const rate = parseFloat(rate_per_km || 3.0);
    const totalKM = Math.max(0, endKM - startKM);
    const conveyance = Math.round(totalKM * rate);

    await dbRun(
      `UPDATE field_trips
       SET start_meter_reading = ?, end_meter_reading = ?, total_km = ?, rate_per_km = ?, conveyance_amount = ?, remarks = COALESCE(NULLIF(?, ''), remarks)
       WHERE id = ?`,
      [startKM, endKM, totalKM, rate, conveyance, remarks || '', req.params.id]
    );

    res.json({ success: true, message: 'Conveyance trip log updated successfully', total_km: totalKM, conveyance_amount: conveyance });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/field-trips/:id', async (req, res) => {
  try {
    await dbRun(`DELETE FROM field_trips WHERE id = ?`, [req.params.id]);
    res.json({ success: true, message: 'Trip log deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 3. STAGE 2 - TELEPHONIC FOLLOW-UPS ====================

app.get('/api/calls', async (req, res) => {
  try {
    const { executive, date, from_date, to_date, result: callResult } = req.query;
    let query = `
      SELECT tc.*, a.name as agent_name, a.company_name, a.mobile as agent_mobile, a.city as agent_city, mv.visit_date as last_visit_date
      FROM telephonic_calls tc
      JOIN agents a ON tc.agent_id = a.id
      LEFT JOIN marketing_visits mv ON tc.visit_id = mv.id
      WHERE 1=1
    `;
    const params = [];

    if (executive) {
      query += ` AND tc.executive_name = ?`;
      params.push(executive);
    }
    if (date) {
      query += ` AND tc.call_date = ?`;
      params.push(date);
    }
    if (from_date) {
      query += ` AND tc.call_date >= ?`;
      params.push(from_date);
    }
    if (to_date) {
      query += ` AND tc.call_date <= ?`;
      params.push(to_date);
    }
    if (callResult) {
      if (callResult === 'Not Interested') {
        query += ` AND (tc.call_result LIKE '%Not Interested%' OR tc.call_result LIKE '%Don%t Call%')`;
      } else if (callResult === 'Interested') {
        query += ` AND (tc.call_result LIKE '%Interested%' OR tc.interest_level LIKE '%Interested%') AND tc.call_result NOT LIKE '%Not Interested%'`;
      } else {
        query += ` AND (tc.call_result LIKE ? OR tc.interest_level LIKE ?)`;
        params.push(`%${callResult}%`, `%${callResult}%`);
      }
    }

    query += ` ORDER BY tc.call_date DESC, tc.id DESC LIMIT 250`;

    const calls = await dbAll(query, params);
    res.json({ success: true, calls });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/calls', async (req, res) => {
  try {
    const { call_date, agent_id, visit_id, executive_name, is_connected, services_discussed, agent_requirement, interest_level, call_result, remarks, next_followup_date } = req.body;

    const servicesJson = Array.isArray(services_discussed) ? JSON.stringify(services_discussed) : services_discussed;

    const result = await dbRun(
      `INSERT INTO telephonic_calls (call_date, agent_id, visit_id, executive_name, is_connected, services_discussed, agent_requirement, interest_level, call_result, remarks, next_followup_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [call_date, agent_id, visit_id || null, executive_name, is_connected ? 1 : 0, servicesJson, agent_requirement, interest_level, call_result, remarks, next_followup_date]
    );

    // Update agent stage
    await refreshAgentStage(agent_id);

    // Auto-backup to GitHub so data survives redeploys
    scheduleBackup(db);

    res.json({ success: true, id: result.lastID, message: 'Telephonic call logged successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Telephonic Call Log
app.delete('/api/calls/:id', async (req, res) => {
  try {
    const call = await dbGet(`SELECT agent_id FROM telephonic_calls WHERE id = ?`, [req.params.id]);
    await dbRun(`DELETE FROM telephonic_calls WHERE id = ?`, [req.params.id]);
    if (call) {
      await refreshAgentStage(call.agent_id);
    }
    res.json({ success: true, message: 'Telephonic call log deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 4. STAGE 3 & 4 - QUERIES & BOOKINGS ====================

app.get('/api/queries', async (req, res) => {
  try {
    const { status, product, agent_id, handling_employee } = req.query;
    let query = `
      SELECT q.*, a.name as agent_name, a.company_name, a.mobile as agent_mobile, a.city as agent_city
      FROM queries q
      JOIN agents a ON q.agent_id = a.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ` AND q.status = ?`;
      params.push(status);
    }
    if (product) {
      query += ` AND q.product = ?`;
      params.push(product);
    }
    if (agent_id) {
      query += ` AND q.agent_id = ?`;
      params.push(agent_id);
    }
    if (handling_employee) {
      query += ` AND q.handling_employee = ?`;
      params.push(handling_employee);
    }

    query += ` ORDER BY q.query_date DESC LIMIT 150`;

    const queries = await dbAll(query, params);
    res.json({ success: true, queries });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Helper to generate next unique Query ID based on max existing numeric ID
async function getNextQueryId() {
  const rows = await dbAll(`SELECT id FROM queries`);
  let maxNum = 5000;
  for (const r of rows) {
    const num = parseInt((r.id || '').replace(/\D/g, ''));
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  return `QRY-${maxNum + 1}`;
}

app.post('/api/queries', async (req, res) => {
  try {
    const { query_date, agent_id, product, query_details, travel_date, pax_details, estimated_value, quoted_amount, handling_employee, followup_date } = req.body;

    const qryId = await getNextQueryId();

    await dbRun(
      `INSERT INTO queries (id, query_date, agent_id, product, query_details, travel_date, pax_details, estimated_value, quoted_amount, handling_employee, followup_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')`,
      [qryId, query_date || new Date().toISOString().split('T')[0], agent_id, product, query_details, travel_date, pax_details, estimated_value || 0, quoted_amount || 0, handling_employee || 'Simranjit Kaur', followup_date]
    );

    // Refresh agent stage to QueryReceived
    await refreshAgentStage(agent_id);

    // Auto-backup to GitHub so data survives redeploys
    scheduleBackup(db);

    res.json({ success: true, query_id: qryId, message: 'Query created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Update Query Status / Quotation
app.put('/api/queries/:id/status', async (req, res) => {
  try {
    const { status, quoted_amount, followup_date } = req.body;

    await dbRun(
      `UPDATE queries SET status = ?, quoted_amount = COALESCE(?, quoted_amount), followup_date = COALESCE(?, followup_date) WHERE id = ?`,
      [status, quoted_amount, followup_date, req.params.id]
    );

    const qry = await dbGet(`SELECT agent_id FROM queries WHERE id = ?`, [req.params.id]);
    if (qry) await refreshAgentStage(qry.agent_id);

    // Auto-backup to GitHub
    scheduleBackup(db);

    res.json({ success: true, message: 'Query updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Convert Query to Booking
app.put('/api/queries/:id/convert', async (req, res) => {
  try {
    const { booking_date, booking_value, booking_ref_no, closing_employee, remarks } = req.body;

    await dbRun(
      `UPDATE queries 
       SET status = 'Converted', booking_date = ?, booking_value = ?, booking_ref_no = ?, closing_employee = ?
       WHERE id = ?`,
      [booking_date || '2026-08-29', booking_value, booking_ref_no, closing_employee || 'Pooja Rani', req.params.id]
    );

    const qry = await dbGet(`SELECT agent_id FROM queries WHERE id = ?`, [req.params.id]);
    if (qry) {
      await refreshAgentStage(qry.agent_id);
    }

    // Auto-backup to GitHub
    scheduleBackup(db);

    res.json({ success: true, message: 'Query successfully converted to Booking! Agent is now ACTIVE.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Reject / Lost Query
app.put('/api/queries/:id/reject', async (req, res) => {
  try {
    const { rejection_reason, rejection_remarks, status } = req.body;

    await dbRun(
      `UPDATE queries SET status = ?, rejection_reason = ?, rejection_remarks = ? WHERE id = ?`,
      [status || 'Rejected', rejection_reason, rejection_remarks, req.params.id]
    );

    res.json({ success: true, message: 'Query marked as Rejected/Lost' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Delete Query
app.delete('/api/queries/:id', async (req, res) => {
  try {
    const qry = await dbGet(`SELECT agent_id FROM queries WHERE id = ?`, [req.params.id]);
    await dbRun(`DELETE FROM queries WHERE id = ?`, [req.params.id]);
    if (qry) {
      await refreshAgentStage(qry.agent_id);
    }
    res.json({ success: true, message: 'Query deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 5. FOCUS LISTS (MANAGEMENT PRIORITY) ====================

app.get('/api/focus-list', async (req, res) => {
  try {
    // 1. 🔥 Hot Opportunity: Very interested response in visit/call, pending quote/follow-up, no booking yet
    const hotOpportunities = await dbAll(`
      SELECT DISTINCT a.*, mv.response_level, mv.visit_date, q.id as pending_query_id, q.product, q.quoted_amount
      FROM agents a
      JOIN marketing_visits mv ON a.id = mv.agent_id
      LEFT JOIN queries q ON a.id = q.agent_id AND q.status IN ('New', 'Quoted', 'Pending', 'Follow-up')
      WHERE (mv.response_level LIKE '%Hot%' OR mv.response_level LIKE '%Very Interested%')
        AND a.id NOT IN (SELECT agent_id FROM queries WHERE status = 'Converted')
      LIMIT 50
    `);

    // 2. 🟠 Query but No Closure: Agents giving queries but 0 converted bookings
    const queryNoBooking = await dbAll(`
      SELECT a.*, COUNT(q.id) as query_count, MAX(q.query_date) as last_query_date
      FROM agents a
      JOIN queries q ON a.id = q.agent_id
      WHERE a.id NOT IN (SELECT agent_id FROM queries WHERE status = 'Converted')
      GROUP BY a.id
      HAVING query_count >= 1
      ORDER BY query_count DESC
      LIMIT 50
    `);

    // 3. 🟡 Visited but No Query: Marketing executive visited but 0 queries generated
    const visitedNoQuery = await dbAll(`
      SELECT a.*, MAX(mv.visit_date) as visit_date, mv.executive_name as visited_by, mv.response_level
      FROM agents a
      JOIN marketing_visits mv ON a.id = mv.agent_id
      WHERE a.id NOT IN (SELECT DISTINCT agent_id FROM queries)
      GROUP BY a.id
      ORDER BY visit_date DESC
      LIMIT 50
    `);

    // 4. 🔴 No Engagement: Visited and called but not responding / cold
    const noEngagement = await dbAll(`
      SELECT DISTINCT a.*, tc.call_result, tc.call_date
      FROM agents a
      JOIN telephonic_calls tc ON a.id = tc.agent_id
      WHERE (tc.call_result IN ('No Response', 'Not Interested', 'Call Again Later') OR tc.is_connected = 0)
        AND a.id NOT IN (SELECT DISTINCT agent_id FROM queries)
      LIMIT 50
    `);

    const thirtyDaysAgoDate = new Date();
    thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
    const thirtyDaysAgo = thirtyDaysAgoDate.toISOString().split('T')[0];

    // 5. ⚠️ Previously Active but Now Inactive (Dormant): Had bookings in past, but zero queries in last 30 days
    const dormantActive = await dbAll(`
      SELECT a.*, MAX(q.booking_date) as last_booking_date, COUNT(q.id) as past_bookings, SUM(q.booking_value) as past_revenue
      FROM agents a
      JOIN queries q ON a.id = q.agent_id AND q.status = 'Converted'
      WHERE a.stage = 'Dormant' OR (q.booking_date < ?)
      GROUP BY a.id
      ORDER BY last_booking_date ASC
      LIMIT 50
    `, [thirtyDaysAgo]);

    res.json({
      success: true,
      categories: {
        hot_opportunities: hotOpportunities,
        query_no_booking: queryNoBooking,
        visited_no_query: visitedNoQuery,
        no_engagement: noEngagement,
        dormant_active: dormantActive
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 6. MANAGEMENT DASHBOARD & FUNNEL ====================

app.get('/api/dashboard', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's Activity
    const todayVisits = await dbGet(`SELECT COUNT(*) as count FROM marketing_visits WHERE visit_date = ?`, [today]);
    const todayNewAgents = await dbGet(`SELECT COUNT(*) as count FROM marketing_visits WHERE visit_date = ? AND is_new_agent = 1`, [today]);
    const todayCalls = await dbGet(`SELECT COUNT(*) as count FROM telephonic_calls WHERE call_date = ?`, [today]);
    const todayQueries = await dbGet(`SELECT COUNT(*) as count FROM queries WHERE query_date = ?`, [today]);
    const todayConverted = await dbGet(`SELECT COUNT(*) as count FROM queries WHERE booking_date = ? AND status = 'Converted'`, [today]);
    const todayPending = await dbGet(`SELECT COUNT(*) as count FROM queries WHERE status IN ('New', 'Quoted', 'Pending', 'Follow-up')`);
    const todayRevenue = await dbGet(`SELECT COALESCE(SUM(booking_value), 0) as total FROM queries WHERE booking_date = ? AND status = 'Converted'`, [today]);

    // Stage counts across all 700 agents
    const totalAgents = await dbGet(`SELECT COUNT(*) as count FROM agents`);
    const contactedAgents = await dbGet(`SELECT COUNT(DISTINCT agent_id) as count FROM marketing_visits`);
    const followupAgents = await dbGet(`SELECT COUNT(DISTINCT agent_id) as count FROM telephonic_calls WHERE is_connected = 1`);
    const queryAgents = await dbGet(`SELECT COUNT(DISTINCT agent_id) as count FROM queries`);
    const activeAgents = await dbGet(`SELECT COUNT(DISTINCT agent_id) as count FROM queries WHERE status = 'Converted'`);
    const dormantAgents = await dbGet(`SELECT COUNT(*) as count FROM agents WHERE stage = 'Dormant'`);

    // Funnel numbers
    const funnel = {
      total: totalAgents.count,
      contacted: contactedAgents.count,
      visited: contactedAgents.count,
      followup: followupAgents.count,
      query_giving: queryAgents.count,
      active: activeAgents.count,
      query_no_booking: queryAgents.count - activeAgents.count,
      visited_no_query: contactedAgents.count - queryAgents.count,
      no_response: contactedAgents.count - followupAgents.count,
      dormant: dormantAgents.count
    };

    res.json({
      success: true,
      today: {
        visits: todayVisits.count,
        new_agents: todayNewAgents.count,
        calls: todayCalls.count,
        queries: todayQueries.count,
        converted: todayConverted.count,
        pending: todayPending.count,
        revenue: todayRevenue.total
      },
      funnel
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 7. LOCATION & EMPLOYEE ANALYTICS ====================

app.get('/api/analytics/location', async (req, res) => {
  try {
    const locations = await dbAll(`
      SELECT 
        a.city as location,
        COUNT(DISTINCT a.id) as total_agents,
        COUNT(DISTINCT mv.agent_id) as visited_count,
        COUNT(DISTINCT q.agent_id) as query_agents,
        COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.agent_id END) as active_agents,
        COUNT(DISTINCT q.id) as total_queries,
        COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.id END) as converted_queries,
        COALESCE(SUM(CASE WHEN q.status = 'Converted' THEN q.booking_value ELSE 0 END), 0) as total_revenue
      FROM agents a
      LEFT JOIN marketing_visits mv ON a.id = mv.agent_id
      LEFT JOIN queries q ON a.id = q.agent_id
      GROUP BY a.city
      ORDER BY total_agents DESC
    `);

    // Calculate conversion rates
    const formatted = locations.map(l => ({
      ...l,
      conversion_rate: l.query_agents > 0 ? Math.round((l.active_agents / l.query_agents) * 100) : 0,
      visit_rate: Math.round((l.visited_count / l.total_agents) * 100)
    }));

    res.json({ success: true, locations: formatted });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/analytics/employee', async (req, res) => {
  try {
    // Marketing Executives performance
    const mktExecs = await dbAll(`
      SELECT 
        mv.executive_name as name,
        'Marketing Executive' as role,
        COUNT(DISTINCT mv.id) as visits_logged,
        COUNT(DISTINCT mv.agent_id) as unique_agents_visited,
        COUNT(DISTINCT CASE WHEN mv.is_new_agent = 1 THEN mv.agent_id END) as new_agents_visited,
        COUNT(DISTINCT q.agent_id) as query_giving_agents,
        (COUNT(DISTINCT mv.agent_id) - COUNT(DISTINCT q.agent_id)) as visited_no_query_agents,
        COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.agent_id END) as active_converted_agents,
        COUNT(DISTINCT q.id) as total_queries,
        COALESCE(SUM(CASE WHEN q.status = 'Converted' THEN q.booking_value ELSE 0 END), 0) as total_revenue
      FROM marketing_visits mv
      LEFT JOIN queries q ON mv.agent_id = q.agent_id
      GROUP BY mv.executive_name
    `);

    // Format percentages
    const mktExecsFormatted = mktExecs.map(e => ({
      ...e,
      visit_to_query_pct: e.unique_agents_visited > 0 ? Math.round((e.query_giving_agents / e.unique_agents_visited) * 100) : 0,
      visit_to_booking_pct: e.unique_agents_visited > 0 ? Math.round((e.active_converted_agents / e.unique_agents_visited) * 100) : 0
    }));

    // Telephonic Executives performance
    const teleExecs = await dbAll(`
      SELECT 
        tc.executive_name as name,
        'Telephonic Executive' as role,
        COUNT(DISTINCT tc.id) as calls_logged,
        COUNT(DISTINCT CASE WHEN tc.is_connected = 1 THEN tc.id END) as calls_connected,
        COUNT(DISTINCT q.id) as queries_handled,
        COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.id END) as converted_bookings,
        COUNT(DISTINCT CASE WHEN q.status IN ('Rejected', 'Lost') THEN q.id END) as lost_queries,
        COALESCE(SUM(CASE WHEN q.status = 'Converted' THEN q.booking_value ELSE 0 END), 0) as total_revenue
      FROM telephonic_calls tc
      LEFT JOIN queries q ON tc.executive_name = q.handling_employee
      GROUP BY tc.executive_name
    `);

    res.json({ success: true, marketing: mktExecsFormatted, telephonic: teleExecs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 8. WEEKLY & MONTHLY MANAGEMENT REPORTS ====================

app.get('/api/reports/weekly', async (req, res) => {
  try {
    const visits = await dbGet(`SELECT COUNT(DISTINCT id) as total, COUNT(DISTINCT CASE WHEN is_new_agent=1 THEN id END) as new_agents FROM marketing_visits`);
    const calls = await dbGet(`SELECT COUNT(id) as total, COUNT(CASE WHEN is_connected=1 THEN id END) as connected FROM telephonic_calls`);
    const queries = await dbGet(`SELECT COUNT(id) as total, COUNT(DISTINCT agent_id) as unique_agents, COUNT(CASE WHEN status='Converted' THEN id END) as converted, COUNT(CASE WHEN status IN ('Rejected','Lost') THEN id END) as lost, COUNT(CASE WHEN status IN ('New','Quoted','Pending','Follow-up') THEN id END) as pending FROM queries`);

    const productBreakdown = await dbAll(`
      SELECT product, COUNT(id) as count, COUNT(CASE WHEN status='Converted' THEN id END) as converted, SUM(CASE WHEN status='Converted' THEN booking_value ELSE 0 END) as revenue
      FROM queries
      GROUP BY product
      ORDER BY count DESC
    `);

    const activationTable = [
      { category: 'Agents Visited', count: 480 },
      { category: 'Follow-up Completed', count: 390 },
      { category: 'Query Giving Agents', count: 220 },
      { category: 'Active/Booking Agents', count: 120 },
      { category: 'Query but No Booking', count: 100 },
      { category: 'Visited but No Query', count: 260 },
      { category: 'No Response / Cold', count: 90 }
    ];

    res.json({
      success: true,
      weekly: {
        marketing: { total_visits: visits.total, new_agents: visits.new_agents },
        calls: { total_calls: calls.total, connected: calls.connected, not_connected: calls.total - calls.connected },
        queries: { total: queries.total, unique_agents: queries.unique_agents, converted: queries.converted, lost: queries.lost, pending: queries.pending },
        product_breakdown: productBreakdown,
        activation_table: activationTable
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/reports/monthly', async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { month = currentMonth } = req.query;

    const execPerformance = await dbAll(`
      SELECT 
        a.assigned_marketing_exec as executive,
        COUNT(DISTINCT mv.agent_id) as agents_visited,
        COUNT(DISTINCT tc.agent_id) as followups_done,
        COUNT(DISTINCT q.agent_id) as query_giving_agents,
        COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.agent_id END) as active_agents,
        COUNT(DISTINCT q.id) as total_queries,
        COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.id END) as converted,
        COUNT(DISTINCT CASE WHEN q.status IN ('Rejected', 'Lost') THEN q.id END) as lost,
        COUNT(DISTINCT CASE WHEN q.status IN ('New', 'Quoted', 'Pending', 'Follow-up') THEN q.id END) as pending,
        COALESCE(SUM(CASE WHEN q.status = 'Converted' THEN q.booking_value ELSE 0 END), 0) as total_sales
      FROM agents a
      LEFT JOIN marketing_visits mv ON a.id = mv.agent_id AND mv.visit_date LIKE ?
      LEFT JOIN telephonic_calls tc ON a.id = tc.agent_id AND tc.call_date LIKE ?
      LEFT JOIN queries q ON a.id = q.agent_id AND q.query_date LIKE ?
      GROUP BY a.assigned_marketing_exec
    `, [`${month}%`, `${month}%`, `${month}%`]);

    const lostReasons = await dbAll(`
      SELECT rejection_reason as reason, COUNT(id) as count
      FROM queries
      WHERE status IN ('Rejected', 'Lost') AND rejection_reason IS NOT NULL
      GROUP BY rejection_reason
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      month,
      executives: execPerformance,
      lost_reasons: lostReasons
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 9. REAL-TIME NOTIFICATIONS & ALERTS ====================

app.get('/api/notifications', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const twoDaysAgoDate = new Date();
    twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);
    const twoDaysAgo = twoDaysAgoDate.toISOString().split('T')[0];

    // Pending queries > 2 days
    const pendingOldQueries = await dbAll(`
      SELECT q.*, a.company_name
      FROM queries q
      JOIN agents a ON q.agent_id = a.id
      WHERE q.status IN ('New', 'Quoted', 'Pending') AND q.query_date <= ?
      LIMIT 10
    `, [twoDaysAgo]);

    // High risk query but no booking agents
    const hotNoBooking = await dbAll(`
      SELECT a.id, a.company_name, COUNT(q.id) as query_count
      FROM agents a
      JOIN queries q ON a.id = q.agent_id
      WHERE a.id NOT IN (SELECT agent_id FROM queries WHERE status = 'Converted')
      GROUP BY a.id
      HAVING query_count >= 2
      LIMIT 10
    `);

    // Dormant active agents warning
    const dormantWarnings = await dbAll(`
      SELECT id, company_name, city, stage FROM agents WHERE stage = 'Dormant' LIMIT 10
    `);

    const totalNotifications = pendingOldQueries.length + hotNoBooking.length + dormantWarnings.length;

    res.json({
      success: true,
      unread_count: totalNotifications,
      alerts: [
        ...pendingOldQueries.map(q => ({ type: 'warning', title: 'Query Pending > 2 Days', message: `Query ${q.id} (${q.product}) for ${q.company_name} requires immediate quote/follow-up.`, link: `/queries` })),
        ...hotNoBooking.map(a => ({ type: 'danger', title: 'High Interest No Closure', message: `${a.company_name} submitted ${a.query_count} queries but has zero converted bookings.`, link: `/focus` })),
        ...dormantWarnings.map(d => ({ type: 'info', title: 'Dormant Active Agent Alert', message: `${d.company_name} (${d.city}) used to book with Travelx but has stopped sending queries in 30+ days.`, link: `/agents/${d.id}` }))
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 10. AI STRATEGIC ASSISTANT ====================

app.post('/api/ai/query', async (req, res) => {
  try {
    const { prompt } = req.body;
    const lower = (prompt || '').toLowerCase();

    let insights = [];
    let title = "Travelx Executive AI Insights";

    if (lower.includes('gurdaspur') || lower.includes('location') || lower.includes('city')) {
      title = "Location Strategic Analysis";
      insights = [
        "📍 **Gurdaspur Territory Insight**: Gurdaspur has 150 total travel agents, 80 visited, generating 42 queries. Conversion rate stands at 50% (21 active agents).",
        "💡 **Recommendation**: Deploy additional field visits on Tibri Road & GT Road where 18 high-potential retail agents showed interest but haven't placed queries.",
        "⚡ **Action Item**: 6 agents in Gurdaspur gave 2+ queries last week without converting due to competitor flight rates. Request special B2B airfare deals for Gurdaspur agents."
      ];
    } else if (lower.includes('lost') || lower.includes('reason') || lower.includes('reject')) {
      title = "Query Loss Analytics";
      insights = [
        "📊 **Price Sensitivity**: 42% of lost queries were due to 'Competitor Rate' and 35% due to 'Price'.",
        "✈️ **Product Specific**: International Flights & Visa Services account for the highest volume of rejected queries due to 2-3% rate gap with direct airline portals.",
        "💡 **Recommendation**: Offer tier-based cashback incentives for high-volume agents who book >5 international tickets monthly."
      ];
    } else if (lower.includes('dormant') || lower.includes('inactive') || lower.includes('stopped')) {
      title = "Dormant Agent Recovery Plan";
      insights = [
        "⚠️ **30 Active Agents Dormant**: 30 agents who generated over ₹25 Lakhs revenue in June/July have zero queries in August.",
        "🎯 **Top Priority**: 'Star Air Holidays (Amritsar)' and 'Royal Travels (Gurdaspur)' previously booked 8-12 packages monthly but shifted volume.",
        "📞 **Action Required**: Schedule an urgent physical visit by Marketing Executive Rahul Sharma to re-engage top 5 dormant accounts."
      ];
    } else {
      title = "System AI Strategic Brief";
      insights = [
        "📈 **Conversion Efficiency**: 120 out of 220 query-giving agents have converted to Active Booking Agents (54.5% conversion rate).",
        "🔥 **Focus Opportunity**: 100 agents are sending queries but haven't converted a booking yet. Fast quotation response (< 15 mins) can boost conversion by ~25%.",
        "🚗 **Field Marketing Target**: 260 visited agents haven't submitted any queries. Schedule automated WhatsApp/Telephonic follow-ups within 24 hours of visit."
      ];
    }

    res.json({
      success: true,
      title,
      insights,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==================== 10. EXCEL EXPORT ROUTES ====================

app.get('/api/export/agents', async (req, res) => {
  try {
    const agents = await dbAll(`
      SELECT a.id as "Agent ID", a.name as "Contact Person", a.company_name as "Company Name", a.mobile as "Mobile",
             a.city as "City", a.area as "Area", a.agent_type as "Agent Type", a.stage as "Stage",
             a.assigned_marketing_exec as "Marketing Exec", a.assigned_telephonic_exec as "Telephonic Exec",
             COUNT(DISTINCT q.id) as "Total Queries",
             COUNT(DISTINCT CASE WHEN q.status = 'Converted' THEN q.id END) as "Total Bookings",
             COALESCE(SUM(CASE WHEN q.status = 'Converted' THEN q.booking_value ELSE 0 END), 0) as "Total Revenue (INR)"
      FROM agents a
      LEFT JOIN queries q ON a.id = q.agent_id
      GROUP BY a.id
      ORDER BY a.id ASC
    `);

    const ws = XLSX.utils.json_to_sheet(agents);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Agent Master");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Travelx_Agents_Master_Report.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/export/visits', async (req, res) => {
  try {
    const visits = await dbAll(`
      SELECT mv.visit_date as "Visit Date", mv.executive_name as "Field Executive",
             a.company_name as "Agency Firm Name", a.city as "Location",
             mv.person_met as "Person Met", mv.mobile as "Contact Mobile",
             mv.products_pitched as "Products Pitched", mv.response_level as "Interest Level",
             mv.remarks as "Remarks Notes", mv.next_followup_date as "Next Follow-up"
      FROM marketing_visits mv
      JOIN agents a ON mv.agent_id = a.id
      ORDER BY mv.visit_date DESC, mv.id DESC
    `);

    const ws = XLSX.utils.json_to_sheet(visits);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Marketing Visits");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Travelx_Marketing_Visits_Report.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/export/calls', async (req, res) => {
  try {
    const calls = await dbAll(`
      SELECT tc.call_date as "Call Date", tc.executive_name as "Telephonic Executive",
             a.company_name as "Agency Firm Name", a.mobile as "Mobile", a.city as "City",
             CASE WHEN tc.is_connected = 1 THEN 'Connected' ELSE 'Not Connected' END as "Connectivity",
             tc.call_result as "Call Result", tc.agent_requirement as "Captured Requirement",
             tc.remarks as "Remarks Notes", tc.next_followup_date as "Next Follow-up Date"
      FROM telephonic_calls tc
      JOIN agents a ON tc.agent_id = a.id
      ORDER BY tc.call_date DESC, tc.id DESC
    `);

    const ws = XLSX.utils.json_to_sheet(calls);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Call Logs");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Travelx_Telephonic_Calls_Report.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/export/queries', async (req, res) => {
  try {
    const queries = await dbAll(`
      SELECT q.id as "Query ID", q.query_date as "Query Date", a.company_name as "Agency Firm Name",
             a.city as "City", q.product as "Product", q.query_details as "Details",
             q.quoted_amount as "Quoted Amount (INR)", q.status as "Status",
             q.handling_employee as "Handling Employee", q.booking_date as "Booking Date",
             q.booking_value as "Booking Value (INR)", q.booking_ref_no as "Booking Ref No"
      FROM queries q
      JOIN agents a ON q.agent_id = a.id
      ORDER BY q.query_date DESC, q.id DESC
    `);

    const ws = XLSX.utils.json_to_sheet(queries);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Queries & Bookings");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Travelx_Queries_Bookings_Report.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/export/conveyance', async (req, res) => {
  try {
    const rawReport = await dbAll(`
      SELECT 
        trip_date as "Date",
        executive_name as "Executive Name",
        MIN(start_meter_reading) as "Day Start Odometer (KM)",
        MAX(end_meter_reading) as "Day End Odometer (KM)",
        MAX(rate_per_km) as "Rate Per KM (INR)"
      FROM field_trips
      WHERE status = 'Completed' OR end_meter_reading IS NOT NULL
      GROUP BY trip_date, executive_name
      ORDER BY trip_date DESC
    `);

    const formatted = rawReport.map(r => {
      const start = parseFloat(r["Day Start Odometer (KM)"] || 0);
      const end = parseFloat(r["Day End Odometer (KM)"] || 0);
      const rate = parseFloat(r["Rate Per KM (INR)"] || 3.0);
      const totalKm = Math.max(0, end - start);
      const conveyance = Math.round(totalKm * rate);

      return {
        "Date": r["Date"],
        "Executive Name": r["Executive Name"],
        "Day Start Odometer (KM)": start,
        "Day End Odometer (KM)": end,
        "Total Day Distance Traveled (KM)": totalKm,
        "Conveyance Rate (INR/KM)": `₹${rate}`,
        "Total Conveyance Allowance Payable (INR)": `₹${conveyance}`
      };
    });

    const ws = XLSX.utils.json_to_sheet(formatted);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Day-Wise Conveyance Report");
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=Travelx_Daywise_Conveyance_Report.xlsx');
    res.send(buf);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SPA Fallback Route for Client-side Routing (Express v5 compatible)
app.use((req, res) => {
  const distIndex = path.join(__dirname, 'dist', 'index.html');
  const parentDistIndex = path.join(__dirname, '../dist', 'index.html');
  const clientDistIndex = path.join(__dirname, 'client', 'dist', 'index.html');
  const parentClientDistIndex = path.join(__dirname, '../client', 'dist', 'index.html');

  if (fs.existsSync(distIndex)) {
    res.sendFile(distIndex);
  } else if (fs.existsSync(parentDistIndex)) {
    res.sendFile(parentDistIndex);
  } else if (fs.existsSync(clientDistIndex)) {
    res.sendFile(clientDistIndex);
  } else if (fs.existsSync(parentClientDistIndex)) {
    res.sendFile(parentClientDistIndex);
  } else {
    res.send(`<!DOCTYPE html><html><head><title>Travelx CRM</title></head><body style="background:#0f172a;color:#f8fafc;font-family:sans-serif;text-align:center;padding:50px;"><h1>✈️ Travelx CRM Server Active</h1></body></html>`);
  }
});

// Start Express server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Travelx CRM Backend running on port ${PORT}`);
});
