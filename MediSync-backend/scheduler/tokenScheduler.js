// scheduler/tokenScheduler.js

const cron = require('node-cron');
const Token = require('../models/Token');
const SystemSettings = require('../models/SystemSettings');

class TokenScheduler {
  constructor() {
    this.token = new Token();
    this.systemSettings = new SystemSettings();
    this.isRunning = false;
  }

  // Start the scheduler
  start() {
    if (this.isRunning) {
      console.log('Token scheduler is already running');
      return;
    }

    // Schedule token deletion at midnight every day (00:00)
    this.dailyCleanupTask = cron.schedule('0 0 * * *', async () => {
      console.log('Running daily token cleanup at midnight...');
      try {
        await this.runDailyCleanup();
      } catch (error) {
        console.error('Error in daily token cleanup:', error);
      }
    }, {
      scheduled: false,
      timezone: 'Asia/Kolkata' // Adjust timezone as needed
    });

    // Start the scheduled task
    this.dailyCleanupTask.start();
    
    this.isRunning = true;
    console.log('Token scheduler started successfully');
    console.log('- Daily cleanup scheduled at midnight (00:00)');
  }

  // Stop the scheduler
  stop() {
    if (!this.isRunning) {
      console.log('Token scheduler is not running');
      return;
    }

    if (this.dailyCleanupTask) {
      this.dailyCleanupTask.stop();
    }

    this.isRunning = false;
    console.log('Token scheduler stopped');
  }

  // Run daily cleanup at midnight
  async runDailyCleanup() {
    try {
      const autoDeleteTime = await this.systemSettings.getSetting('auto_delete_tokens_time');
      const currentTime = new Date().toTimeString().slice(0, 5);

      // Check if auto-delete is enabled and it's the right time
      if (autoDeleteTime === '00:00' || autoDeleteTime === currentTime) {
        const deletedCount = await this.token.deleteOldTokens();

        // Log cleanup activity
        await this.logCleanupActivity('daily', deletedCount);
      }
    } catch (error) {
      console.error('Error in daily cleanup:', error);
      throw error;
    }
  }

  // Log cleanup activity for monitoring
  async logCleanupActivity(type, deletedCount) {
    try {
      // You can extend this to log to a separate table if needed
      console.log(`[${new Date().toISOString()}] Token cleanup - Type: ${type}, Deleted: ${deletedCount} tokens`);
    } catch (error) {
      console.error('Error logging cleanup activity:', error);
    }
  }

  // Manual cleanup method for admin use
  async manualCleanup(daysOld = 1) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const result = await this.token.db(this.token.table)
        .where('date', '<', cutoffDate.toISOString().split('T')[0])
        .del();

      await this.logCleanupActivity('manual', result);
      
      return result;
    } catch (error) {
      console.error('Error in manual cleanup:', error);
      throw error;
    }
  }

  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      nextDailyCleanup: this.dailyCleanupTask ? this.dailyCleanupTask.getStatus() : null
    };
  }
}

module.exports = TokenScheduler;
