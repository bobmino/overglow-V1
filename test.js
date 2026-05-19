const https = require('https');
https.get('https://overglow-backend.vercel.app/api/products?limit=10', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', data));
});
