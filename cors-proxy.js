const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());

// Proxy for Marin County GIS
app.use('/marin-gis', createProxyMiddleware({
  target: 'https://gisopendata.marincounty.gov',
  changeOrigin: true,
  pathRewrite: {
    '^/marin-gis': ''
  }
}));

// Proxy for Google Solar API
app.use('/solar-api', createProxyMiddleware({
  target: 'https://solar.googleapis.com',
  changeOrigin: true,
  pathRewrite: {
    '^/solar-api': ''
  }
}));

// Serve static files
app.use(express.static('.'));

app.listen(PORT, () => {
  console.log(`CORS proxy server running on http://localhost:${PORT}`);
  console.log('Marin GIS proxy: http://localhost:3001/marin-gis');
  console.log('Solar API proxy: http://localhost:3001/solar-api');
});
