// ...existing code...
const BaseModel = require('./BaseModel');

class OperationTheatre extends BaseModel {
  constructor() {
    super('operation_theatres');
  }

  // Get all OTs with current status and schedules
  async getAllOTsWithStatus() {
    try {
      console.log('Fetching operation theatres with doctor info...');
      // Join users table to get doctor name, include assignment date/time
      const ots = await this.db(this.table)
        .leftJoin('users as doctor', 'operation_theatres.doctor_id', 'doctor.id')
        .select(
          'operation_theatres.*',
          'doctor.name as doctor_name',
          'operation_theatres.assignment_date',
          'operation_theatres.assignment_time'
        )
        .orderBy('operation_theatres.ot_number');
      
      // Format dates properly to avoid timezone issues
      const formattedOTs = ots.map(ot => ({
        ...ot,
        assignment_date: ot.assignment_date ? 
          (ot.assignment_date instanceof Date ? 
            ot.assignment_date.toISOString().split('T')[0] : 
            ot.assignment_date) : null,
        assignment_time: ot.assignment_time ? 
          (typeof ot.assignment_time === 'string' ? 
            ot.assignment_time.substring(0, 5) : 
            ot.assignment_time) : null
      }));
      
      console.log('Found OTs:', formattedOTs.length);
      return formattedOTs;
    } catch (error) {
      console.error('Error in getAllOTsWithStatus:', error);
      console.error('Stack trace:', error.stack);
      throw new Error(`Error fetching OTs with status: ${error.message}`);
    }
  }

  // Get OTs assigned to a specific doctor
  async getAssignedOTs(doctorId) {
    try {
      const ots = await this.db(this.table)
        .leftJoin('users as doctor', 'operation_theatres.doctor_id', 'doctor.id')
        .select(
          'operation_theatres.*',
          'doctor.name as doctor_name',
          'operation_theatres.assignment_date',
          'operation_theatres.assignment_time'
        )
        .where('operation_theatres.doctor_id', doctorId)
        .orderBy('operation_theatres.ot_number');
      
      // Format dates properly to avoid timezone issues
      const formattedOTs = ots.map(ot => ({
        ...ot,
        assignment_date: ot.assignment_date ? 
          (ot.assignment_date instanceof Date ? 
            ot.assignment_date.toISOString().split('T')[0] : 
            ot.assignment_date) : null,
        assignment_time: ot.assignment_time ? 
          (typeof ot.assignment_time === 'string' ? 
            ot.assignment_time.substring(0, 5) : 
            ot.assignment_time) : null
      }));
      
      return formattedOTs;
    } catch (error) {
      throw new Error(`Error fetching assigned OTs: ${error.message}`);
    }
  }

  // Get available OTs for emergency
  async getAvailableOTsForEmergency() {
    try {
      return await this.db(this.table)
        .where('status', 'available')
        .orWhere('status', 'cleaning')
        .orderBy('ot_number');
    } catch (error) {
      throw new Error(`Error fetching available OTs: ${error.message}`);
    }
  }

  // Update OT status
  async updateOTStatus(otId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: this.db.fn.now(),
        ...additionalData
      };
      
      await this.db(this.table)
        .where('id', otId)
        .update(updateData);
      
      return await this.findById(otId);
    } catch (error) {
      throw new Error(`Error updating OT status: ${error.message}`);
    }
  }

  // Get OT schedule for today
  async getTodaySchedule() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      return await this.db('ot_schedules')
        .join('operation_theatres', 'ot_schedules.ot_id', 'operation_theatres.id')
        .leftJoin('users as surgeon', 'ot_schedules.primary_surgeon_id', 'surgeon.id')
        .leftJoin('users as anesthesiologist', 'ot_schedules.anesthesiologist_id', 'anesthesiologist.id')
        .leftJoin('patients', 'ot_schedules.patient_id', 'patients.id')
        .leftJoin('departments', 'ot_schedules.department_id', 'departments.id')
        .where('ot_schedules.scheduled_date', today)
        .whereNotIn('ot_schedules.status', ['cancelled', 'completed'])
        .select(
          'ot_schedules.*',
          'operation_theatres.ot_number',
          'operation_theatres.status as ot_status',
          'surgeon.name as surgeon_name',
          'anesthesiologist.name as anesthesiologist_name',
          'patients.name as patient_name',
          'patients.phone_number as patient_contact',
          'patients.age as patient_age',
          'departments.name as department_name'
        )
        .orderBy(['ot_schedules.scheduled_start_time', 'operation_theatres.ot_number']);
    } catch (error) {
      throw new Error(`Error fetching today's schedule: ${error.message}`);
    }
  }

  // Get emergency protocols
  async getEmergencyProtocols() {
    try {
      return await this.db('ot_emergency_protocols')
        .where('is_active', true)
        .orderBy('emergency_level', 'desc');
    } catch (error) {
      throw new Error(`Error fetching emergency protocols: ${error.message}`);
    }
  }

  // Reserve OT for emergency
  async reserveOTForEmergency(otId, emergencyData) {
    try {
      const trx = await this.db.transaction();
      
      try {
        // Update OT status to emergency
        await trx(this.table)
          .where('id', otId)
          .update({
            status: 'emergency',
            emergency_level: emergencyData.emergency_level,
            current_procedure: emergencyData.procedure_name,
            patient_name: emergencyData.patient_name,
            updated_at: this.db.fn.now()
          });

        // Create emergency schedule
        const scheduleData = {
          ot_id: otId,
          schedule_type: 'emergency',
          procedure_name: emergencyData.procedure_name,
          patient_id: emergencyData.patient_id,
          primary_surgeon_id: emergencyData.surgeon_id,
          department_id: emergencyData.department_id,
          scheduled_date: new Date(),
          scheduled_start_time: new Date(),
          estimated_duration: emergencyData.estimated_duration || 120,
          priority: 'emergency',
          emergency_level: emergencyData.emergency_level,
          is_emergency: true,
          status: 'confirmed',
          created_by: emergencyData.created_by,
          special_instructions: emergencyData.special_instructions
        };

        const [scheduleId] = await trx('ot_schedules').insert(scheduleData);
        
        await trx.commit();
        
        return {
          ot: await this.findById(otId),
          schedule: await this.db('ot_schedules').where('id', scheduleId).first()
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      throw new Error(`Error reserving OT for emergency: ${error.message}`);
    }
  }

  // Get OT utilization statistics
  async getOTUtilizationStats(startDate, endDate) {
    try {
      const stats = await this.db('ot_schedules')
        .join('operation_theatres', 'ot_schedules.ot_id', 'operation_theatres.id')
        .whereBetween('ot_schedules.scheduled_date', [startDate, endDate])
        .select(
          'operation_theatres.ot_number',
          this.db.raw('COUNT(*) as total_surgeries'),
          this.db.raw('AVG(actual_duration) as avg_duration'),
          this.db.raw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed'),
          this.db.raw('SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled'),
          this.db.raw('SUM(CASE WHEN is_emergency = true THEN 1 ELSE 0 END) as emergencies')
        )
        .groupBy('operation_theatres.id', 'operation_theatres.ot_number')
        .orderBy('operation_theatres.ot_number');
      
      return stats;
    } catch (error) {
      throw new Error(`Error fetching OT utilization stats: ${error.message}`);
    }
  }
}

module.exports = OperationTheatre;
