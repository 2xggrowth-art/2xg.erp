// Vercel serverless function wrapper for Express app
try {
  const serverModule = require('../backend/dist/server');
  const app = serverModule.default || serverModule;

  // Export for Vercel
  module.exports = app;
} catch (error) {
  console.error('Error loading Express app:', error);
  module.exports = (req, res) => {
    res.status(500).json({
      error: 'Server initialization failed',
      message: error.message
    });
  };
}
