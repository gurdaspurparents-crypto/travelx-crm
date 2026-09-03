const { spawn } = require('child_process');
const path = require('path');
const localtunnel = require('localtunnel');

// Start Express Node Server
function startServer() {
  console.log('🚀 Starting Express CRM Server on port 5000...');
  const server = spawn('node', [path.join(__dirname, 'index.js')], {
    stdio: 'inherit',
    shell: true
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}. Restarting in 2s...`);
    setTimeout(startServer, 2000);
  });
}

// Start Localtunnel with persistent subdomain
async function startTunnel() {
  try {
    console.log('🌐 Connecting Localtunnel (travelx-b2b-crm.loca.lt)...');
    const tunnel = await localtunnel({ port: 5000, subdomain: 'travelx-b2b-crm' });
    console.log('========================================================');
    console.log(` ✅ LIVE FIXED CRM URL: ${tunnel.url}`);
    console.log('========================================================');

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3s...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
      setTimeout(startTunnel, 3000);
    });
  } catch (err) {
    console.error('Localtunnel start error:', err.message);
    setTimeout(startTunnel, 5000);
  }
}

startServer();
// Wait 2 seconds for Express server to start before connecting tunnel
setTimeout(startTunnel, 2000);
