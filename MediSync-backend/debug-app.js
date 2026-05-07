require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const cookieParser = require('cookie-parser');

const app = express();

// Basic CORS configuration
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://medisync-1-i00r.onrender.com',
    'http://localhost:4173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);

// Simple test route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Basic Express server is working' });
});

// Test each route file individually
console.log('Testing route file imports...');

try {
  console.log('Testing authRoutes...');
  const authRoutes = require('./routes/authRoutes');
  console.log('✓ authRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing authRoutes:', error.message);
}

try {
  console.log('Testing patientRoutes...');
  const patientRoutes = require('./routes/patientRoutes');
  console.log('✓ patientRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing patientRoutes:', error.message);
}

try {
  console.log('Testing tokenRoutes...');
  const tokenRoutes = require('./routes/tokenRoutes');
  console.log('✓ tokenRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing tokenRoutes:', error.message);
}

try {
  console.log('Testing departmentRoutes...');
  const departmentRoutes = require('./routes/departmentRoutes');
  console.log('✓ departmentRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing departmentRoutes:', error.message);
}

try {
  console.log('Testing drugRoutes...');
  const drugRoutes = require('./routes/drugRoutes');
  console.log('✓ drugRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing drugRoutes:', error.message);
}

try {
  console.log('Testing otRoutes...');
  const otRoutes = require('./routes/otRoutes');
  console.log('✓ otRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing otRoutes:', error.message);
}

try {
  console.log('Testing displayRoutes...');
  const displayRoutes = require('./routes/displayRoutes');
  console.log('✓ displayRoutes imported successfully');
} catch (error) {
  console.error('❌ Error importing displayRoutes:', error.message);
}

server.listen(process.env.PORT || 3000, () => {
  console.log(`Debug server running on port ${process.env.PORT || 3000}`);
});
