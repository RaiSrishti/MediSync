const BaseModel = require('./BaseModel');

class SystemSettings extends BaseModel {
  constructor() {
    super('system_settings');
  }

  // Get a setting by key
  async getSetting(key) {
    try {
      const setting = await this.db(this.table)
        .where({ setting_key: key, is_active: true })
        .first();
      
      return setting ? setting.setting_value : null;
    } catch (error) {
      console.error('Error getting system setting:', error);
      throw error;
    }
  }

  // Update a setting (upsert - insert if not exists, update if exists)
  async updateSetting(key, value) {
    try {
      // First check if setting exists
      const existing = await this.db(this.table)
        .where({ setting_key: key })
        .first();

      if (existing) {
        // Update existing setting
        const updated = await this.db(this.table)
          .where({ setting_key: key })
          .update({
            setting_value: value,
            updated_at: new Date()
          });
        return updated > 0;
      } else {
        // Insert new setting
        await this.db(this.table).insert({
          setting_key: key,
          setting_value: value,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        return true;
      }
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  }

  // Get all active settings
  async getAllSettings() {
    try {
      const settings = await this.db(this.table)
        .where({ is_active: true })
        .select('setting_key', 'setting_value', 'description');

      // Convert to key-value object
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.setting_key] = {
          value: setting.setting_value,
          description: setting.description
        };
      });

      return settingsObj;
    } catch (error) {
      console.error('Error getting all settings:', error);
      throw error;
    }
  }

  // Check if token generation is allowed at current time
  async isTokenGenerationAllowed() {
    try {
      const isEnabled = await this.getSetting('token_time_restriction_enabled');
      console.log('Time restriction enabled:', isEnabled);
      
      if (isEnabled !== 'true') {
        console.log('Time restrictions are disabled');
        return { allowed: true, message: 'Time restrictions disabled' };
      }

      const startTime = await this.getSetting('token_generation_start_time');
      const endTime = await this.getSetting('token_generation_end_time');
      console.log('Time window settings:', { startTime, endTime });

      if (!startTime || !endTime) {
        console.log('Time settings not configured');
        return { allowed: true, message: 'Time settings not configured' };
      }

      // Use IST (Indian Standard Time) for comparison
      const now = new Date();
      // Convert UTC to IST (UTC+5:30)
      const istOffset = 5.5 * 60 * 60 * 1000; // 5.5 hours in milliseconds
      const istTime = new Date(now.getTime() + istOffset);
      const currentTime = istTime.toTimeString().slice(0, 5); // HH:MM format
      
      // Convert times to minutes for easier comparison
      const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };
      
      const currentMinutes = timeToMinutes(currentTime);
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      console.log('Time comparison:', {
        currentTime,
        currentMinutes,
        startTime,
        startMinutes,
        endTime,
        endMinutes,
        serverTimeUTC: now.toISOString(),
        serverTimeIST: istTime.toISOString()
      });

      if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
        console.log('Token generation allowed - within time window');
        return { allowed: true, message: 'Token generation allowed' };
      } else {
        console.log('Token generation blocked - outside time window');
        return { 
          allowed: false, 
          message: `Token generation is only allowed between ${startTime} and ${endTime}. Current time (IST): ${currentTime}`,
          timeWindow: { startTime, endTime, currentTime }
        };
      }
    } catch (error) {
      console.error('Error checking token generation time:', error);
      return { allowed: true, message: 'Error checking time restrictions' };
    }
  }

  // Get token generation time window
  async getTokenTimeWindow() {
    try {
      const startTime = await this.getSetting('token_generation_start_time');
      const endTime = await this.getSetting('token_generation_end_time');
      const isEnabled = await this.getSetting('token_time_restriction_enabled');

      return {
        startTime: startTime || '07:00',
        endTime: endTime || '20:00',
        enabled: isEnabled === 'true'
      };
    } catch (error) {
      console.error('Error getting token time window:', error);
      return {
        startTime: '07:00',
        endTime: '20:00',
        enabled: false
      };
    }
  }
}

module.exports = SystemSettings;
