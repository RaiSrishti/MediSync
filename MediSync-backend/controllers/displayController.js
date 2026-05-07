const Display = require('../models/Display');

class DisplayController {
  constructor() {
    this.displayModel = new Display();
  }

  // Get department-specific display board
  getDepartmentDisplay = async (req, res) => {
    try {
      const { departmentId } = req.params;
      
      if (!departmentId) {
        return res.status(400).json({
          success: false,
          message: 'Department ID is required'
        });
      }

      const displayData = await this.displayModel.getDepartmentDisplayData(departmentId);

      res.json({
        success: true,
        data: displayData,
        message: 'Department display data retrieved successfully'
      });

      // Emit real-time update
      if (req.io) {
        req.io.emit('department_display_update', {
          department_id: departmentId,
          data: displayData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching department display:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department display data',
        error: error.message
      });
    }
  };

  // Get public queue display for all departments
  getPublicDisplay = async (req, res) => {
    try {
      const publicData = await this.displayModel.getPublicQueueDisplay();

      res.json({
        success: true,
        data: publicData,
        message: 'Public display data retrieved successfully'
      });

      // Emit real-time update for public displays
      if (req.io) {
        req.io.emit('public_display_update', {
          data: publicData,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching public display:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch public display data',
        error: error.message
      });
    }
  };

  // Get emergency information display
  getEmergencyDisplay = async (req, res) => {
    try {
      const emergencyData = await this.displayModel.getEmergencyDisplayData();

      res.json({
        success: true,
        data: emergencyData,
        message: 'Emergency display data retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching emergency display:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch emergency display data',
        error: error.message
      });
    }
  };

  // Get hospital announcements
  getAnnouncementsDisplay = async (req, res) => {
    try {
      const announcements = await this.displayModel.getAnnouncementsDisplay();

      res.json({
        success: true,
        data: announcements,
        message: 'Announcements retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch announcements',
        error: error.message
      });
    }
  };

  // Get live hospital statistics
  getLiveStats = async (req, res) => {
    try {
      const stats = await this.displayModel.getLiveStatistics();

      res.json({
        success: true,
        data: stats,
        message: 'Live statistics retrieved successfully'
      });

      // Emit real-time statistics update
      if (req.io) {
        req.io.emit('live_stats_update', {
          data: stats,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching live stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch live statistics',
        error: error.message
      });
    }
  };

  // Get comprehensive display dashboard
  getDisplayDashboard = async (req, res) => {
    try {
      const [publicData, emergencyData, announcements, stats] = await Promise.all([
        this.displayModel.getPublicQueueDisplay(),
        this.displayModel.getEmergencyDisplayData(),
        this.displayModel.getAnnouncementsDisplay(),
        this.displayModel.getLiveStatistics()
      ]);

      const dashboard = {
        public_queue: publicData,
        emergency_info: emergencyData,
        announcements: announcements,
        live_statistics: stats,
        last_updated: new Date().toISOString()
      };

      res.json({
        success: true,
        data: dashboard,
        message: 'Display dashboard retrieved successfully'
      });

      // Emit comprehensive dashboard update
      if (req.io) {
        req.io.emit('display_dashboard_update', {
          data: dashboard,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error fetching display dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch display dashboard',
        error: error.message
      });
    }
  };

  // Get department queue summary for displays
  getDepartmentQueueSummary = async (req, res) => {
    try {
      const { departmentId } = req.params;
      
      const queueSummary = await this.displayModel.getDepartmentDisplayData(departmentId);
      
      // Simplified summary for small displays
      const summary = {
        department_name: queueSummary.department.name,
        current_token: queueSummary.current_serving?.token_number || 'None',
        waiting_count: queueSummary.statistics.waiting_count,
        next_tokens: queueSummary.queue
          .filter(token => token.status === 'waiting')
          .slice(0, 5)
          .map(token => token.token_number),
        estimated_wait: queueSummary.statistics.average_wait_time,
        last_updated: new Date().toLocaleTimeString()
      };

      res.json({
        success: true,
        data: summary,
        message: 'Department queue summary retrieved successfully'
      });
    } catch (error) {
      console.error('Error fetching department queue summary:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department queue summary',
        error: error.message
      });
    }
  };
}

module.exports = new DisplayController();
