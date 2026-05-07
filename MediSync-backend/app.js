require('dotenv').config();
const express=require('express');
const cors=require('cors');
const http=require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');



// Import the token scheduler
const TokenScheduler = require('./scheduler/tokenScheduler');

const app=express();

// CORS must be first
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'https://medisync-1-i00r.onrender.com',
    'http://localhost:4173'
  ], // Vite dev, dev fallback, and preview ports
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());
app.use(cookieParser());
const server=http.createServer(app);
const io=socketIo(server, {
  cors: {
    origin: [
      'http://localhost:5173', 
      'http://localhost:5174', 
      'https://medisync-1-i00r.onrender.com', 
      'http://localhost:4173'
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
  }
});

// Initialize the token scheduler
const tokenScheduler = new TokenScheduler();

app.locals.io=io;

// Debug middleware to log CORS-related info
// Basic request logging (simplified)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Middleware to pass Socket.IO to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// CORS test route
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS is working!',
    origin: req.get('Origin'),
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Simple health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/patients', require('./routes/patientRoutes'));
app.use('/api/tokens', require('./routes/tokenRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));
app.use('/api/drugs', require('./routes/drugRoutes'));
app.use('/api/ot', require('./routes/otRoutes'));
app.use('/api/display', require('./routes/displayRoutes'));

// Socket.io events with room-based communication
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

    // Join department-specific room
    socket.on('joinDepartment', (departmentId) => {
      socket.join(`department_${departmentId}`);
      console.log(`Client ${socket.id} joined department_${departmentId}`);
      
      // Send welcome message with current queue status
      socket.emit('joinedDepartment', {
        message: `Connected to department ${departmentId}`,
        departmentId
      });
    });

  // Join OT monitoring room
  socket.on('joinOTMonitoring', () => {
    socket.join('ot_monitoring');
    console.log(`Client ${socket.id} joined OT monitoring room`);
    
    socket.emit('joinedOTMonitoring', {
      message: 'Connected to OT monitoring system',
      timestamp: new Date().toISOString()
    });
  });

  // Join emergency monitoring room
  socket.on('joinEmergencyMonitoring', () => {
    socket.join('emergency_monitoring');
    console.log(`Client ${socket.id} joined emergency monitoring room`);
    
    socket.emit('joinedEmergencyMonitoring', {
      message: 'Connected to emergency monitoring system',
      timestamp: new Date().toISOString()
    });
  });

  // Join specific OT room for real-time updates
  socket.on('joinOT', (otId) => {
    socket.join(`ot_${otId}`);
    console.log(`Client ${socket.id} joined OT_${otId}`);
    
    socket.emit('joinedOT', {
      message: `Connected to OT ${otId} monitoring`,
      otId
    });
  });

  // Join patient-specific room for real-time token updates
  socket.on('joinRoom', (roomName) => {
    socket.join(roomName);
    console.log(`Client ${socket.id} joined room: ${roomName}`);
    
    socket.emit('joinedRoom', {
      message: `Connected to ${roomName}`,
      room: roomName,
      timestamp: new Date().toISOString()
    });
  });

  // Leave department room
  socket.on('leaveDepartment', (departmentId) => {
    socket.leave(`department_${departmentId}`);
    console.log(`Client ${socket.id} left department_${departmentId}`);
  });

  // Leave OT monitoring
  socket.on('leaveOTMonitoring', () => {
    socket.leave('ot_monitoring');
    console.log(`Client ${socket.id} left OT monitoring room`);
  });

  // Leave emergency monitoring
  socket.on('leaveEmergencyMonitoring', () => {
    socket.leave('emergency_monitoring');
    console.log(`Client ${socket.id} left emergency monitoring room`);
  });

  // Handle token updates from client
  socket.on('requestQueueUpdate', async (departmentId) => {
    try {
      const Token = require('./models/Token');
      const tokenModel = new Token();
      const queue = await tokenModel.getDepartmentQueue(departmentId);
      const stats = await tokenModel.getTodayStats(departmentId);
      
      socket.emit('queueUpdate', { queue, stats });
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch queue update' });
    }
  });

  // Join display monitoring rooms
  socket.on('joinDisplayMonitoring', () => {
    socket.join('display_monitoring');
    console.log(`Client ${socket.id} joined display monitoring room`);
    
    socket.emit('joinedDisplayMonitoring', {
      message: 'Connected to display monitoring',
      timestamp: new Date().toISOString()
    });
  });

  // Join public display room
  socket.on('joinPublicDisplay', () => {
    socket.join('public_display');
    console.log(`Client ${socket.id} joined public display room`);
    
    socket.emit('joinedPublicDisplay', {
      message: 'Connected to public display updates',
      timestamp: new Date().toISOString()
    });
  });

  // Handle display dashboard update requests
  socket.on('requestDisplayUpdate', async () => {
    try {
      const Display = require('./models/Display');
      const displayModel = new Display();
      
      const [publicData, emergencyData, announcements, stats] = await Promise.all([
        displayModel.getPublicQueueDisplay(),
        displayModel.getEmergencyDisplayData(),
        displayModel.getAnnouncementsDisplay(),
        displayModel.getLiveStatistics()
      ]);

      const dashboard = {
        public_queue: publicData,
        emergency_info: emergencyData,
        announcements: announcements,
        live_statistics: stats,
        last_updated: new Date().toISOString()
      };
      
      socket.emit('displayDashboardUpdate', dashboard);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch display dashboard update' });
    }
  });

  // Handle department display update requests
  socket.on('requestDepartmentDisplay', async (departmentId) => {
    try {
      const Display = require('./models/Display');
      const displayModel = new Display();
      const displayData = await displayModel.getDepartmentDisplayData(departmentId);
      
      socket.emit('departmentDisplayUpdate', {
        department_id: departmentId,
        data: displayData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch department display update' });
    }
  });

  // Leave display monitoring
  socket.on('leaveDisplayMonitoring', () => {
    socket.leave('display_monitoring');
    console.log(`Client ${socket.id} left display monitoring room`);
  });

  // Leave public display monitoring
  socket.on('leavePublicDisplay', () => {
    socket.leave('public_display');
    console.log(`Client ${socket.id} left public display room`);
  });

  // Handle OT status board update requests
  socket.on('requestOTStatusUpdate', async () => {
    try {
      const OperationTheatre = require('./models/OperationTheatre');
      const otModel = new OperationTheatre();
      const statusBoard = await otModel.getAllOTsWithStatus();
      
      socket.emit('otStatusUpdate', statusBoard);
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch OT status update' });
    }
  });

  // Handle emergency dashboard update requests
  socket.on('requestEmergencyUpdate', async () => {
    try {
      const OperationTheatre = require('./models/OperationTheatre');
      const DoctorAvailability = require('./models/DoctorAvailability');
      
      const otModel = new OperationTheatre();
      const doctorModel = new DoctorAvailability();
      
      const [availableOTs, availableDoctors] = await Promise.all([
        otModel.getAvailableOTsForEmergency(),
        doctorModel.getAvailableDoctorsForEmergency()
      ]);
      
      socket.emit('emergencyDashboardUpdate', {
        availableOTs,
        availableDoctors,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      socket.emit('error', { message: 'Failed to fetch emergency dashboard update' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

server.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
  
  // Start the token scheduler
  try {
    tokenScheduler.start();
    console.log('Token scheduler initialized successfully');
  } catch (error) {
    console.error('Failed to start token scheduler:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  tokenScheduler.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  tokenScheduler.stop();
  server.close(() => {
    console.log('Process terminated');
  });
});