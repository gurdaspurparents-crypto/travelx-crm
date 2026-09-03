const localtunnel = require('localtunnel');

async function startTunnel() {
  try {
    console.log('Starting fixed subdomain tunnel (travelx-b2b-crm)...');
    const tunnel = await localtunnel({ port: 5000, subdomain: 'travelx-b2b-crm' });
    console.log(`========================================================`);
    console.log(` PERMANENT FIXED CRM URL: ${tunnel.url}`);
    console.log(`========================================================`);

    tunnel.on('close', () => {
      console.log('Tunnel closed. Reconnecting in 3 seconds...');
      setTimeout(startTunnel, 3000);
    });

    tunnel.on('error', (err) => {
      console.error('Tunnel error:', err);
    });
  } catch (err) {
    console.error('Failed to start tunnel, retrying in 5 seconds...', err.message);
    setTimeout(startTunnel, 5000);
  }
}

startTunnel();
