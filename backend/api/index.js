// Import the Express app from the compiled server
const app = require('../dist/server').default || require('../dist/server');

// Export for Vercel serverless
module.exports = app;
