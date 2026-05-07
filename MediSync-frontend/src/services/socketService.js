import { io } from 'socket.io-client';


class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
  }

  connect() {
    if (this.socket) {
      this.disconnect();
    }

    // Get backend URL - use the environment variable first, then derive from API URL
    let backendUrl = import.meta.env.VITE_BACKEND_URL;
    
    if (!backendUrl && import.meta.env.VITE_API_BASE_URL) {
      backendUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
    }
    
    if (!backendUrl) {
      backendUrl = 'http://localhost:3000';
    }

    console.log('Connecting to Socket.IO server at:', backendUrl);

    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      timeout: 20000,
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully');
      this.isConnected = true;
      this.setupEventListeners();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('🚫 Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
    }
  }

  setupEventListeners() {
    this.eventListeners.forEach((handler, event) => {
      this.socket.on(event, handler);
    });
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, callback);
      if (this.socket) {
        this.socket.on(event, callback);
      }
    }
  }

  off(event, callback) {
    this.eventListeners.delete(event);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event} - socket not connected`);
    }
  }

  getSocket() {
    return this.socket;
  }
}

export default new SocketService();