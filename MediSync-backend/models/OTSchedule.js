const BaseModel = require('./BaseModel');

class OTSchedule extends BaseModel {
  constructor() {
    super('ot_schedules');
  }

  // Create new OT schedule with validation
  async createSchedule(data) {
    try {
      // Validate OT availability
      const otAvailable = await this.checkOTAvailability(
        data.ot_id, 
        data.scheduled_date, 
        data.scheduled_start_time, 
        data.scheduled_end_time
      );
      
      if (!otAvailable) {
        throw new Error('Operation Theatre is not available for the requested time slot');
      }

      // Validate doctor availability
      const doctorAvailable = await this.checkDoctorAvailability(
        data.primary_surgeon_id,
        data.scheduled_date,
        data.scheduled_start_time,
        data.scheduled_end_time
      );

      if (!doctorAvailable) {
        throw new Error('Primary surgeon is not available for the requested time slot');
      }

      const scheduleData = {
        ...data,
        status: data.is_emergency ? 'confirmed' : 'scheduled',
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now()
      };

      const [id] = await this.db(this.table).insert(scheduleData);
      
      // Update OT status if emergency
      if (data.is_emergency) {
        await this.db('operation_theatres')
          .where('id', data.ot_id)
          .update({ status: 'emergency' });
      }

      return await this.getScheduleWithDetails(id);
    } catch (error) {
      throw new Error(`Error creating schedule: ${error.message}`);
    }
  }

  // Get schedule with full details
  async getScheduleWithDetails(scheduleId) {
    try {
      return await this.db(this.table)
        .leftJoin('operation_theatres as ot', 'ot_schedules.ot_id', 'ot.id')
        .leftJoin('patients', 'ot_schedules.patient_id', 'patients.id')
        .leftJoin('users as surgeon', 'ot_schedules.primary_surgeon_id', 'surgeon.id')
        .leftJoin('users as anesthesiologist', 'ot_schedules.anesthesiologist_id', 'anesthesiologist.id')
        .leftJoin('departments', 'ot_schedules.department_id', 'departments.id')
        .where('ot_schedules.id', scheduleId)
        .select(
          'ot_schedules.*',
          'ot.ot_number',
          'ot.status as ot_status',
          'patients.name as patient_name',
          'patients.phone_number as patient_contact',
          'patients.age as patient_age',
          'patients.gender as patient_gender',
          'surgeon.name as surgeon_name',
          'surgeon.contact_number as surgeon_contact',
          'anesthesiologist.name as anesthesiologist_name',
          'departments.name as department_name'
        )
        .first();
    } catch (error) {
      throw new Error(`Error fetching schedule details: ${error.message}`);
    }
  }

  // Check OT availability for scheduling
  async checkOTAvailability(otId, date, startTime, endTime, excludeScheduleId = null) {
    try {
      let query = this.db(this.table)
        .where('ot_id', otId)
        .where('scheduled_date', date)
        .whereNotIn('status', ['cancelled', 'completed'])
        .where(function() {
          this.whereBetween('scheduled_start_time', [startTime, endTime])
              .orWhereBetween('scheduled_end_time', [startTime, endTime])
              .orWhere(function() {
                this.where('scheduled_start_time', '<=', startTime)
                    .where('scheduled_end_time', '>=', endTime);
              });
        });

      if (excludeScheduleId) {
        query = query.whereNot('id', excludeScheduleId);
      }

      const conflicts = await query;
      return conflicts.length === 0;
    } catch (error) {
      throw new Error(`Error checking OT availability: ${error.message}`);
    }
  }

  // Check doctor availability
  async checkDoctorAvailability(doctorId, date, startTime, endTime, excludeScheduleId = null) {
    try {
      let query = this.db(this.table)
        .where(function() {
          this.where('primary_surgeon_id', doctorId)
              .orWhere('anesthesiologist_id', doctorId);
        })
        .where('scheduled_date', date)
        .whereNotIn('status', ['cancelled', 'completed'])
        .where(function() {
          this.whereBetween('scheduled_start_time', [startTime, endTime])
              .orWhereBetween('scheduled_end_time', [startTime, endTime])
              .orWhere(function() {
                this.where('scheduled_start_time', '<=', startTime)
                    .where('scheduled_end_time', '>=', endTime);
              });
        });

      if (excludeScheduleId) {
        query = query.whereNot('id', excludeScheduleId);
      }

      const conflicts = await query;
      return conflicts.length === 0;
    } catch (error) {
      throw new Error(`Error checking doctor availability: ${error.message}`);
    }
  }

  // Get upcoming schedules
  async getUpcomingSchedules(limit = 10) {
    try {
      const now = new Date();
      return await this.db(this.table)
        .leftJoin('operation_theatres as ot', 'ot_schedules.ot_id', 'ot.id')
        .leftJoin('patients', 'ot_schedules.patient_id', 'patients.id')
        .leftJoin('users as surgeon', 'ot_schedules.primary_surgeon_id', 'surgeon.id')
        .leftJoin('departments', 'ot_schedules.department_id', 'departments.id')
        .where('ot_schedules.scheduled_date', '>=', now.toISOString().split('T')[0])
        .whereNotIn('ot_schedules.status', ['cancelled', 'completed'])
        .select(
          'ot_schedules.id',
          'ot_schedules.procedure_name',
          'ot_schedules.scheduled_date',
          'ot_schedules.scheduled_start_time',
          'ot_schedules.estimated_duration',
          'ot_schedules.priority',
          'ot_schedules.is_emergency',
          'ot_schedules.status',
          'ot.ot_number',
          'patients.name as patient_name',
          'surgeon.name as surgeon_name',
          'departments.name as department_name'
        )
        .orderBy([
          { column: 'ot_schedules.priority', order: 'desc' },
          { column: 'ot_schedules.scheduled_date', order: 'asc' },
          { column: 'ot_schedules.scheduled_start_time', order: 'asc' }
        ])
        .limit(limit);
    } catch (error) {
      throw new Error(`Error fetching upcoming schedules: ${error.message}`);
    }
  }

  // Update schedule status
  async updateScheduleStatus(scheduleId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: this.db.fn.now(),
        ...additionalData
      };

      // Handle status-specific updates
      if (status === 'in_progress') {
        updateData.actual_start_time = this.db.fn.now();
        
        // Update OT status
        const schedule = await this.findById(scheduleId);
        await this.db('operation_theatres')
          .where('id', schedule.ot_id)
          .update({ status: 'in-use' });
      }

      if (status === 'completed') {
        updateData.actual_end_time = this.db.fn.now();
        
        // Calculate actual duration
        const schedule = await this.findById(scheduleId);
        if (schedule.actual_start_time) {
          const startTime = new Date(schedule.actual_start_time);
          const endTime = new Date();
          updateData.actual_duration = Math.round((endTime - startTime) / (1000 * 60)); // in minutes
        }
        
        // Update OT status to cleaning
        await this.db('operation_theatres')
          .where('id', schedule.ot_id)
          .update({ status: 'cleaning' });
      }

      await this.db(this.table)
        .where('id', scheduleId)
        .update(updateData);

      return await this.getScheduleWithDetails(scheduleId);
    } catch (error) {
      throw new Error(`Error updating schedule status: ${error.message}`);
    }
  }

  // Get emergency schedules
  async getEmergencySchedules() {
    try {
      return await this.db(this.table)
        .leftJoin('operation_theatres as ot', 'ot_schedules.ot_id', 'ot.id')
        .leftJoin('patients', 'ot_schedules.patient_id', 'patients.id')
        .leftJoin('users as surgeon', 'ot_schedules.primary_surgeon_id', 'surgeon.id')
        .leftJoin('departments', 'ot_schedules.department_id', 'departments.id')
        .where('ot_schedules.is_emergency', true)
        .whereNotIn('ot_schedules.status', ['completed', 'cancelled'])
        .select(
          'ot_schedules.*',
          'ot.ot_number',
          'ot.status as ot_status',
          'patients.name as patient_name',
          'patients.phone_number as patient_contact',
          'surgeon.name as surgeon_name',
          'departments.name as department_name'
        )
        .orderBy('ot_schedules.emergency_level', 'desc')
        .orderBy('ot_schedules.created_at', 'asc');
    } catch (error) {
      throw new Error(`Error fetching emergency schedules: ${error.message}`);
    }
  }

  // Get schedule conflicts
  async getScheduleConflicts(date) {
    try {
      return await this.db(this.table)
        .leftJoin('operation_theatres as ot', 'ot_schedules.ot_id', 'ot.id')
        .leftJoin('users as surgeon', 'ot_schedules.primary_surgeon_id', 'surgeon.id')
        .where('ot_schedules.scheduled_date', date)
        .whereNotIn('ot_schedules.status', ['cancelled', 'completed'])
        .select(
          'ot_schedules.*',
          'ot.ot_number',
          'surgeon.name as surgeon_name'
        )
        .orderBy('ot_schedules.scheduled_start_time');
    } catch (error) {
      throw new Error(`Error fetching schedule conflicts: ${error.message}`);
    }
  }

  // Get active schedules for a specific OT
  async getActiveSchedulesByOT(otId) {
    try {
      return await this.db(this.table)
        .where('ot_id', otId)
        .whereIn('status', ['scheduled', 'in_progress', 'in_preparation', 'confirmed'])
        .orderBy('scheduled_start_time');
    } catch (error) {
      throw new Error(`Error fetching active schedules for OT: ${error.message}`);
    }
  }

  // Get schedules by date range
  async getSchedulesByDateRange(startDate, endDate) {
    try {
      return await this.db(this.table)
        .select(`${this.table}.*`, 'users.name as doctor_name', 'patients.name as patient_name')
        .leftJoin('users', `${this.table}.primary_surgeon_id`, 'users.id')
        .leftJoin('patients', `${this.table}.patient_id`, 'patients.id')
        .where('scheduled_date', '>=', startDate)
        .where('scheduled_date', '<', endDate)
        .orderBy('scheduled_start_time');
    } catch (error) {
      throw new Error(`Error fetching schedules by date range: ${error.message}`);
    }
  }

  // Get emergency schedules
  async getEmergencySchedules(startDate, endDate) {
    try {
      return await this.db(this.table)
        .select(`${this.table}.*`, 'users.name as doctor_name', 'patients.name as patient_name')
        .leftJoin('users', `${this.table}.primary_surgeon_id`, 'users.id')
        .leftJoin('patients', `${this.table}.patient_id`, 'patients.id')
        .where('scheduled_date', '>=', startDate)
        .where('scheduled_date', '<', endDate)
        .where('is_emergency', true)
        .orderBy('scheduled_start_time');
    } catch (error) {
      throw new Error(`Error fetching emergency schedules: ${error.message}`);
    }
  }
}

module.exports = OTSchedule;
