require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import routes
const authRoutes = require('./routes/auth');
const adsRoutes = require('./routes/ads');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5500',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/ads', adsRoutes);
app.use('/api', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Amazon Ads Automation API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth/*',
      ads: '/api/ads/*'
    }
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ [ERROR]', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(60));
    console.log('\n🚀 [SERVER] Amazon Ads Automation Backend');
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ [SERVER] Backend running on http://localhost:${PORT}`);
    console.log(`🌐 [CORS] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5500'}`);
    console.log(`🔐 [AUTH] LWA configured: ${process.env.LWA_CLIENT_ID ? '✅ Yes' : '❌ No'}`);
    console.log(`💾 [DATABASE] Connected: ${process.env.DATABASE_URL ? '✅ Yes' : '❌ No'}`);
    console.log('\n' + '='.repeat(60) + '\n');
  });
}

module.exports = app;