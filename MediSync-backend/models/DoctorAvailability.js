const BaseModel = require('./BaseModel');

class DoctorAvailability extends BaseModel {
  constructor() {
    super('doctor_availability');
  }

  // Update doctor's current status
  async updateDoctorStatus(doctorId, status, additionalData = {}) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const updateData = {
        status,
        last_updated: this.db.fn.now(),
        ...additionalData
      };

      // Check if record exists for today
      const existingRecord = await this.db(this.table)
        .where('doctor_id', doctorId)
        .where('date', today)
        .first();

      if (existingRecord) {
        await this.db(this.table)
          .where('doctor_id', doctorId)
          .where('date', today)
          .update(updateData);
      } else {
        // Create new record
        const newRecord = {
          doctor_id: doctorId,
          date: today,
          start_time: '08:00:00',
          end_time: '18:00:00',
          is_on_duty: true,
          ...updateData
        };
        
        await this.db(this.table).insert(newRecord);
      }

      return await this.getDoctorCurrentStatus(doctorId);
    } catch (error) {
      throw new Error(`Error updating doctor status: ${error.message}`);
    }
  }

  // Get current status of a doctor
  async getDoctorCurrentStatus(doctorId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      return await this.db(this.table)
        .leftJoin('users', 'doctor_availability.doctor_id', 'users.id')
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('operation_theatres', 'doctor_availability.current_ot_id', 'operation_theatres.id')
        .where('doctor_availability.doctor_id', doctorId)
        .where('doctor_availability.date', today)
        .select(
          'doctor_availability.*',
          'users.name as doctor_name',
          'users.email as doctor_email',
          'departments.name as department_name',
          'operation_theatres.ot_number'
        )
        .first();
    } catch (error) {
      throw new Error(`Error fetching doctor status: ${error.message}`);
    }
  }

  // Get all available doctors for emergency
  async getAvailableDoctorsForEmergency(emergencyType = null, minLevel = 1) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let query = this.db(this.table)
        .join('users', 'doctor_availability.doctor_id', 'users.id')
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .where('doctor_availability.date', today)
        .where('doctor_availability.available_for_emergency', true)
        .where('doctor_availability.max_emergency_level', '>=', minLevel)
        .whereIn('doctor_availability.status', ['available', 'on_call'])
        .where('users.is_approved', true)
        .where('users.role', 'doctor');

      if (emergencyType) {
        query = query.whereRaw(
          "JSON_CONTAINS(doctor_availability.emergency_specialties, ?)", 
          [JSON.stringify(emergencyType)]
        );
      }

      return await query.select(
        'doctor_availability.*',
        'users.name as doctor_name',
        'users.email as doctor_email',
        'departments.name as department_name',
        'departments.name as specialty'
      )
      .orderBy('doctor_availability.max_emergency_level', 'desc')
      .orderBy('doctor_availability.last_updated', 'asc');
    } catch (error) {
      throw new Error(`Error fetching available doctors for emergency: ${error.message}`);
    }
  }

  // Get all doctors with current status
  async getAllDoctorsStatus() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      return await this.db('users')
        .leftJoin('doctor_availability', function() {
          this.on('users.id', '=', 'doctor_availability.doctor_id')
              .andOn('doctor_availability.date', '=', this.client.raw('?', [today]));
        })
        .leftJoin('departments', 'users.department_id', 'departments.id')
        .leftJoin('operation_theatres', 'doctor_availability.current_ot_id', 'operation_theatres.id')
        .where('users.role', 'doctor')
        .where('users.is_approved', true)
        .select(
          'users.id as doctor_id',
          'users.name as doctor_name',
          'users.email as doctor_email',
          'departments.name as department_name',
          'doctor_availability.status',
          'doctor_availability.current_activity',
          'doctor_availability.available_for_emergency',
          'doctor_availability.current_location',
          'doctor_availability.estimated_free_time',
          'doctor_availability.next_available_time',
          'doctor_availability.is_on_duty',
          'doctor_availability.last_updated',
          'operation_theatres.ot_number as current_ot'
        )
        .orderBy(['departments.name', 'users.name']);
    } catch (error) {
      throw new Error(`Error fetching all doctors status: ${error.message}`);
    }
  }

  // Set doctor as busy with specific activity
  async setDoctorBusy(doctorId, activity, estimatedFreeTime = null, otId = null, scheduleId = null) {
    try {
      const additionalData = {
        current_activity: activity,
        estimated_free_time: estimatedFreeTime,
        current_ot_id: otId,
        current_schedule_id: scheduleId
      };

      if (estimatedFreeTime) {
        const nextAvailable = new Date();
        nextAvailable.setMinutes(nextAvailable.getMinutes() + estimatedFreeTime);
        additionalData.next_available_time = nextAvailable;
      }

      return await this.updateDoctorStatus(doctorId, 'busy', additionalData);
    } catch (error) {
      throw new Error(`Error setting doctor as busy: ${error.message}`);
    }
  }

  // Set doctor as in surgery
  async setDoctorInSurgery(doctorId, otId, scheduleId, estimatedDuration) {
    try {
      const nextAvailable = new Date();
      nextAvailable.setMinutes(nextAvailable.getMinutes() + estimatedDuration);

      return await this.updateDoctorStatus(doctorId, 'in_surgery', {
        current_activity: 'Surgery in progress',
        current_ot_id: otId,
        current_schedule_id: scheduleId,
        estimated_free_time: estimatedDuration,
        next_available_time: nextAvailable,
        available_for_emergency: false
      });
    } catch (error) {
      throw new Error(`Error setting doctor in surgery: ${error.message}`);
    }
  }

  // Set doctor as available
  async setDoctorAvailable(doctorId, location = null) {
    try {
      return await this.updateDoctorStatus(doctorId, 'available', {
        current_activity: null,
        current_ot_id: null,
        current_schedule_id: null,
        estimated_free_time: null,
        next_available_time: null,
        available_for_emergency: true,
        current_location: location
      });
    } catch (error) {
      throw new Error(`Error setting doctor as available: ${error.message}`);
    }
  }

  // Get department-wise doctor availability
  async getDepartmentWiseAvailability() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      return await this.db('departments')
        .leftJoin('users', 'departments.id', 'users.department_id')
        .leftJoin('doctor_availability', function() {
          this.on('users.id', '=', 'doctor_availability.doctor_id')
              .andOn('doctor_availability.date', '=', this.client.raw('?', [today]));
        })
        .where('users.role', 'doctor')
        .where('users.is_approved', true)
        .select(
          'departments.id as department_id',
          'departments.name as department_name',
          this.db.raw('COUNT(users.id) as total_doctors'),
          this.db.raw('SUM(CASE WHEN doctor_availability.status = "available" THEN 1 ELSE 0 END) as available_doctors'),
          this.db.raw('SUM(CASE WHEN doctor_availability.status = "in_surgery" THEN 1 ELSE 0 END) as doctors_in_surgery'),
          this.db.raw('SUM(CASE WHEN doctor_availability.status = "busy" THEN 1 ELSE 0 END) as busy_doctors'),
          this.db.raw('SUM(CASE WHEN doctor_availability.available_for_emergency = true THEN 1 ELSE 0 END) as emergency_available')
        )
        .groupBy('departments.id', 'departments.name')
        .orderBy('departments.name');
    } catch (error) {
      throw new Error(`Error fetching department-wise availability: ${error.message}`);
    }
  }

  // Initialize daily availability for all doctors
  async initializeDailyAvailability(date = null) {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      
      // Get all approved doctors
      const doctors = await this.db('users')
        .where('role', 'doctor')
        .where('is_approved', true)
        .select('id', 'department_id');

      const availabilityRecords = doctors.map(doctor => ({
        doctor_id: doctor.id,
        date: targetDate,
        start_time: '08:00:00',
        end_time: '18:00:00',
        status: 'available',
        available_for_emergency: true,
        is_on_duty: true,
        max_emergency_level: 3,
        emergency_specialties: '[]'
      }));

      // Insert only if not exists
      for (const record of availabilityRecords) {
        const exists = await this.db(this.table)
          .where('doctor_id', record.doctor_id)
          .where('date', record.date)
          .first();

        if (!exists) {
          await this.db(this.table).insert(record);
        }
      }

      return { initialized: availabilityRecords.length };
    } catch (error) {
      throw new Error(`Error initializing daily availability: ${error.message}`);
    }
  }

  // Get available doctors for emergency
  async getAvailableDoctorsForEmergency() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      return await this.db(this.table)
        .select(
          'doctor_availability.*',
          'users.name',
          'users.specialization'
        )
        .join('users', 'doctor_availability.doctor_id', 'users.id')
        .where('doctor_availability.date', today)
        .where('doctor_availability.is_on_duty', true)
        .whereIn('doctor_availability.status', ['available', 'on_call'])
        .where('users.role', 'doctor')
        .orderBy('users.specialization');
    } catch (error) {
      console.error('Error fetching available doctors for emergency:', error);
      // Return empty array if there's an error to prevent breaking the emergency dashboard
      return [];
    }
  }
}

module.exports = DoctorAvailability;
