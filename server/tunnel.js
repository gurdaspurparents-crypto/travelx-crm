const localtunnel = require('localtunnel');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 5000, subdomain: 'travelx-b2b-crm' });
    console.log(`========================================================`);
    console.log(` PERMANENT FIXED CRM URL: ${tunnel.url}`);
    console.log(`========================================================`);
    
    tunnel.on('close', () => {
      console.log('Tunnel connection closed. Reconnecting...');
    });
  } catch (err) {
    console.error('Tunnel Error:', err);
  }
})();
