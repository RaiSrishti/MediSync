const BaseModel = require('./BaseModel');

class Display extends BaseModel {
  constructor() {
    super('departments'); // Use departments table for display data
  }

  // Get department display board data
  async getDepartmentDisplayData(departmentId) {
    try {
      // Get department info with current queue
      const department = await this.db('departments')
        .where('id', departmentId)
        .first();

      if (!department) {
        throw new Error('Department not found');
      }

      // Get current queue for display
      const queue = await this.db('tokens')
        .leftJoin('patients', 'tokens.patient_id', 'patients.id')
        .where('tokens.department_id', departmentId)
        .where('tokens.date', new Date().toISOString().split('T')[0])
        .whereIn('tokens.status', ['waiting', 'called', 'in-progress'])
        .select(
          'tokens.token_number',
          'tokens.status',
          'tokens.priority',
          'tokens.estimated_time',
          'patients.name as patient_name'
        )
        .orderBy('tokens.priority', 'desc')
        .orderBy('tokens.token_number', 'asc');

      // Get current token being served
      const currentToken = await this.db('tokens')
        .leftJoin('patients', 'tokens.patient_id', 'patients.id')
        .where('tokens.department_id', departmentId)
        .where('tokens.status', 'in-progress')
        .select(
          'tokens.token_number',
          'patients.name as patient_name'
        )
        .first();

      // Get waiting statistics
      const stats = await this.db('tokens')
        .where('department_id', departmentId)
        .where('date', new Date().toISOString().split('T')[0])
        .select(
          this.db.raw('COUNT(*) as total_tokens'),
          this.db.raw('SUM(CASE WHEN status = "waiting" THEN 1 ELSE 0 END) as waiting_count'),
          this.db.raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_count'),
          this.db.raw('AVG(CASE WHEN status = "completed" THEN estimated_time ELSE NULL END) as avg_wait_time')
        )
        .first();

      return {
        department: {
          id: department.id,
          name: department.name,
          description: department.description,
          current_token: department.current_token
        },
        current_serving: currentToken,
        queue: queue.map(token => ({
          token_number: token.token_number,
          status: token.status,
          priority: token.priority,
          estimated_time: token.estimated_time,
          is_current: token.status === 'in-progress'
        })),
        statistics: {
          total_tokens: parseInt(stats.total_tokens) || 0,
          waiting_count: parseInt(stats.waiting_count) || 0,
          completed_count: parseInt(stats.completed_count) || 0,
          average_wait_time: Math.round(parseFloat(stats.avg_wait_time) || 0)
        },
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error fetching department display data: ${error.message}`);
    }
  }

  // Get public queue display for all departments
  async getPublicQueueDisplay() {
    try {
      const departments = await this.db('departments')
        .where('is_active', true)
        .select('id', 'name', 'current_token');

      const displayData = [];

      for (const dept of departments) {
        const queueInfo = await this.db('tokens')
          .where('department_id', dept.id)
          .where('date', new Date().toISOString().split('T')[0])
          .select(
            this.db.raw('COUNT(*) as total_tokens'),
            this.db.raw('SUM(CASE WHEN status = "waiting" THEN 1 ELSE 0 END) as waiting_count'),
            this.db.raw('MAX(CASE WHEN status = "in-progress" THEN token_number ELSE NULL END) as current_token'),
            this.db.raw('AVG(CASE WHEN status = "completed" THEN estimated_time ELSE NULL END) as avg_wait_time')
          )
          .first();

        displayData.push({
          department_id: dept.id,
          department_name: dept.name,
          current_token: queueInfo.current_token || 0,
          waiting_count: parseInt(queueInfo.waiting_count) || 0,
          total_tokens: parseInt(queueInfo.total_tokens) || 0,
          avg_wait_time: Math.round(parseFloat(queueInfo.avg_wait_time) || 0)
        });
      }

      return {
        departments: displayData,
        hospital_info: {
          name: 'MediSync Hospital',
          current_time: new Date().toLocaleString(),
          emergency_number: '911',
          info_desk: 'Ground Floor, Main Entrance'
        },
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error fetching public display data: ${error.message}`);
    }
  }

  // Get emergency information for public display
  async getEmergencyDisplayData() {
    try {
      // Get emergency announcements (can be stored in a future announcements table)
      const emergencyInfo = {
        hospital_status: 'OPERATIONAL',
        emergency_contacts: {
          ambulance: '911',
          police: '911',
          fire_department: '911',
          hospital_emergency: 'Ext. 911',
          information: 'Ext. 100'
        },
        departments: {
          emergency_room: 'Open 24/7',
          surgery: 'Available',
          icu: 'Available',
          pharmacy: 'Open 8AM - 10PM'
        },
        important_notices: [
          'Visiting hours: 2PM - 8PM',
          'Emergency patients get priority',
          'Please maintain social distancing',
          'Masks required in all areas'
        ],
        last_updated: new Date().toISOString()
      };

      return emergencyInfo;
    } catch (error) {
      throw new Error(`Error fetching emergency display data: ${error.message}`);
    }
  }

  // Get hospital announcements
  async getAnnouncementsDisplay() {
    try {
      // For now, return static announcements
      // In future, this can be from an announcements table
      const announcements = {
        urgent: [
          'Emergency drill scheduled for tomorrow at 2PM',
          'New COVID-19 protocols in effect'
        ],
        general: [
          'Free health checkup camp on weekends',
          'New parking area opened on the east side',
          'Pharmacy now offers home delivery service',
          'Online appointment booking available on website'
        ],
        services: [
          'Lab reports available online',
          '24/7 emergency services available',
          'Ambulance service: Call 911',
          'Patient feedback: Ext. 200'
        ],
        timings: {
          opd: '8AM - 6PM',
          emergency: '24/7',
          pharmacy: '8AM - 10PM',
          lab: '6AM - 8PM',
          visiting_hours: '2PM - 8PM'
        },
        last_updated: new Date().toISOString()
      };

      return announcements;
    } catch (error) {
      throw new Error(`Error fetching announcements: ${error.message}`);
    }
  }

  // Get live statistics for display
  async getLiveStatistics() {
    try {
      const today = new Date().toISOString().split('T')[0];

      const stats = await this.db('tokens')
        .where('date', today)
        .select(
          this.db.raw('COUNT(*) as total_patients_today'),
          this.db.raw('SUM(CASE WHEN status = "waiting" THEN 1 ELSE 0 END) as currently_waiting'),
          this.db.raw('SUM(CASE WHEN status = "in-progress" THEN 1 ELSE 0 END) as being_served'),
          this.db.raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_today'),
          this.db.raw('AVG(CASE WHEN status = "completed" THEN estimated_time ELSE NULL END) as avg_wait_time')
        )
        .first();

      // Get department-wise breakdown
      const departmentStats = await this.db('tokens')
        .leftJoin('departments', 'tokens.department_id', 'departments.id')
        .where('tokens.date', today)
        .groupBy('tokens.department_id', 'departments.name')
        .select(
          'departments.name as department_name',
          this.db.raw('COUNT(*) as department_patients'),
          this.db.raw('SUM(CASE WHEN tokens.status = "waiting" THEN 1 ELSE 0 END) as waiting')
        );

      return {
        overall: {
          total_patients_today: parseInt(stats.total_patients_today) || 0,
          currently_waiting: parseInt(stats.currently_waiting) || 0,
          being_served: parseInt(stats.being_served) || 0,
          completed_today: parseInt(stats.completed_today) || 0,
          average_wait_time: Math.round(parseFloat(stats.avg_wait_time) || 0)
        },
        departments: departmentStats,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`Error fetching live statistics: ${error.message}`);
    }
  }
}

module.exports = Display;
