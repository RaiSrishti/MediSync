const OperationTheatre = require('../models/OperationTheatre');
const OTSchedule = require('../models/OTSchedule');
const DoctorAvailability = require('../models/DoctorAvailability');

class OTController {
  constructor() {
    this.operationTheatre = new OperationTheatre();
    this.otSchedule = new OTSchedule();
    this.doctorAvailability = new DoctorAvailability();

  // Bind methods to preserve 'this' context in routes
  this.getAllOTs = this.getAllOTs.bind(this);
  this.getAssignedOTs = this.getAssignedOTs.bind(this);
  this.getOTById = this.getOTById.bind(this);
  this.createOT = this.createOT.bind(this);
  this.updateOT = this.updateOT.bind(this);
  this.deleteOT = this.deleteOT.bind(this);
  this.updateOTStatus = this.updateOTStatus.bind(this);
  this.getOTStatusBoard = this.getOTStatusBoard.bind(this);
  this.getAllDoctorsAvailability = this.getAllDoctorsAvailability.bind(this);
  this.getEmergencyDashboard = this.getEmergencyDashboard.bind(this);
  this.getUpcomingSchedules = this.getUpcomingSchedules.bind(this);
  }

  // Get OT Status Board (Real-time dashboard)
  async getOTStatusBoard(req, res) {
    try {
      // Fetch actual OT data from database
      const theatres = await this.operationTheatre.getAllOTsWithStatus();
      
      // Get current schedules for today
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const currentSchedules = await this.otSchedule.getSchedulesByDateRange(todayStart, todayEnd);
      
      // Process theatres with current status
      const processedTheatres = await Promise.all(theatres.map(async (theatre) => {
        // Find current schedule for this OT
        const currentSchedule = currentSchedules.find(schedule => 
          schedule.ot_id === theatre.id && 
          schedule.status === 'in_progress'
        );
        
        // Find next scheduled surgery
        const nextSchedule = currentSchedules.find(schedule => 
          schedule.ot_id === theatre.id && 
          schedule.status === 'scheduled' &&
          new Date(schedule.scheduled_start_time) > new Date()
        );
        
        return {
          id: theatre.id,
          name: theatre.name,
          ot_number: theatre.ot_number,
          status: currentSchedule ? 'busy' : (theatre.status || 'available'),
          currentSurgery: currentSchedule ? {
            id: currentSchedule.id,
            type: currentSchedule.surgery_type,
            doctor: currentSchedule.doctor_name,
            patient: currentSchedule.patient_name,
            startTime: currentSchedule.actual_start_time || currentSchedule.scheduled_start_time,
            estimatedDuration: currentSchedule.estimated_duration
          } : null,
          nextScheduled: nextSchedule ? {
            id: nextSchedule.id,
            type: nextSchedule.surgery_type,
            doctor: nextSchedule.doctor_name,
            patient: nextSchedule.patient_name,
            scheduledTime: nextSchedule.scheduled_start_time,
            estimatedDuration: nextSchedule.estimated_duration
          } : null,
          capacity: theatre.capacity,
          equipment: theatre.equipment_list
        };
      }));

      // Calculate summary statistics
      const summary = {
        totalOTs: processedTheatres.length,
        availableOTs: processedTheatres.filter(ot => ot.status === 'available').length,
        inUseOTs: processedTheatres.filter(ot => ot.status === 'busy').length,
        maintenanceOTs: processedTheatres.filter(ot => ot.status === 'maintenance').length,
        totalSchedulesToday: currentSchedules.length,
        completedToday: currentSchedules.filter(s => s.status === 'completed').length,
        inProgressToday: currentSchedules.filter(s => s.status === 'in_progress').length
      };

      const statusBoard = {
        theatres: processedTheatres,
        summary,
        lastUpdated: new Date().toISOString()
      };

      res.json(statusBoard);
    } catch (error) {
      console.error('OT status board error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
  async getEmergencyDashboard(req, res) {
    try {
      // Fetch emergency-related data from database
      const theatres = await this.operationTheatre.getAllOTs();
      const availableOTs = theatres.filter(ot => ot.status === 'available' || ot.status === 'emergency');
      
      // Get today's emergency schedules
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      
      const emergencySchedules = await this.otSchedule.getEmergencySchedules(todayStart, todayEnd);
      
      // Get available doctors (this would need to be implemented in DoctorAvailability model)
      const availableDoctors = await this.doctorAvailability.getAvailableDoctorsForEmergency();
      
      const emergencyDashboard = {
        activeEmergencies: emergencySchedules.filter(schedule => 
          schedule.status === 'in_progress' && schedule.priority === 'emergency'
        ).map(emergency => ({
          id: emergency.id,
          type: emergency.surgery_type,
          location: `OT ${emergency.ot_id}`,
          doctor: emergency.doctor_name,
          patient: emergency.patient_name,
          startTime: emergency.actual_start_time || emergency.scheduled_start_time,
          severity: emergency.emergency_level || 'high'
        })),
        statistics: {
          totalAvailableOTs: availableOTs.length,
          totalAvailableDoctors: availableDoctors.length,
          activeEmergencies: emergencySchedules.filter(s => s.status === 'in_progress').length,
          emergencyOTs: theatres.filter(ot => ot.status === 'emergency').length,
          maintenanceOTs: theatres.filter(ot => ot.status === 'maintenance').length
        },
        availableResources: {
          theatres: availableOTs.map(ot => ({
            id: ot.id,
            name: ot.name,
            capacity: ot.capacity,
            equipment: ot.equipment_list
          })),
          doctors: availableDoctors.map(doctor => ({
            id: doctor.id,
            name: doctor.name,
            specialization: doctor.specialization,
            available_until: doctor.available_until
          }))
        },
        lastUpdated: new Date().toISOString()
      };

      res.json(emergencyDashboard);
    } catch (error) {
      console.error('Emergency dashboard error:', error);
      
      // Fallback to basic data if there are database issues
      const basicEmergencyDashboard = {
        activeEmergencies: [],
        statistics: {
          totalAvailableOTs: 0,
          totalAvailableDoctors: 0,
          activeEmergencies: 0,
          emergencyOTs: 0,
          maintenanceOTs: 0
        },
        availableResources: {
          theatres: [],
          doctors: []
        },
        lastUpdated: new Date().toISOString(),
        error: 'Unable to fetch complete emergency data'
      };
      
      res.json(basicEmergencyDashboard);
    }
  }

  // Create new OT schedule
  async createSchedule(req, res) {
    try {
      const scheduleData = {
        ...req.body,
        created_by: req.user.id
      };

      const schedule = await this.otSchedule.createSchedule(scheduleData);

      // Emit real-time notification
      if (req.io) {
        req.io.emit('newOTSchedule', {
          schedule,
          message: `New ${schedule.is_emergency ? 'emergency' : ''} surgery scheduled`,
          type: schedule.is_emergency ? 'emergency' : 'scheduled'
        });
      }

      res.status(201).json({
        success: true,
        message: 'OT schedule created successfully',
        data: schedule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create emergency schedule
  async createEmergencySchedule(req, res) {
    try {
      const emergencyData = {
        ...req.body,
        is_emergency: true,
        priority: 'emergency',
        status: 'confirmed',
        created_by: req.user.id
      };

      // Find available OT
      const availableOTs = await this.operationTheatre.getAvailableOTsForEmergency();
      if (availableOTs.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No operation theatres available for emergency'
        });
      }

      // Use first available OT
      emergencyData.ot_id = availableOTs[0].id;

      const emergencySchedule = await this.otSchedule.createSchedule(emergencyData);

      // Update doctor availability
      if (emergencyData.primary_surgeon_id) {
        await this.doctorAvailability.setDoctorInSurgery(
          emergencyData.primary_surgeon_id,
          emergencyData.ot_id,
          emergencySchedule.id,
          emergencyData.estimated_duration || 120
        );
      }

      // Emit emergency alert
      if (req.io) {
        req.io.emit('emergencyAlert', {
          type: 'new_emergency',
          schedule: emergencySchedule,
          message: `Emergency surgery scheduled in OT ${availableOTs[0].ot_number}`,
          priority: emergencyData.emergency_level,
          timestamp: new Date().toISOString()
        });
      }

      res.status(201).json({
        success: true,
        message: 'Emergency schedule created successfully',
        data: emergencySchedule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update schedule status
  async updateScheduleStatus(req, res) {
    try {
      const { scheduleId } = req.params;
      const { status, notes } = req.body;

      const updatedSchedule = await this.otSchedule.updateScheduleStatus(
        scheduleId, 
        status, 
        { 
          post_op_notes: notes,
          updated_by: req.user.id 
        }
      );

      // Update doctor availability based on status
      if (status === 'completed' && updatedSchedule.primary_surgeon_id) {
        await this.doctorAvailability.setDoctorAvailable(
          updatedSchedule.primary_surgeon_id,
          'Post-surgery recovery area'
        );
      }

      // Emit status update
      if (req.io) {
        req.io.emit('scheduleStatusUpdate', {
          scheduleId,
          status,
          schedule: updatedSchedule,
          message: `Surgery status updated to ${status}`,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Schedule status updated successfully',
        data: updatedSchedule
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get upcoming schedules
  async getUpcomingSchedules(req, res) {
    try {
      const { limit = 10 } = req.query;
      const upcomingSchedules = await this.otSchedule.getUpcomingSchedules(parseInt(limit));

      res.json({
        success: true,
        data: upcomingSchedules,
        count: upcomingSchedules.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update doctor availability
  async updateDoctorAvailability(req, res) {
    try {
      const { doctorId } = req.params;
      const { status, location, activity, estimated_free_time } = req.body;

      let result;
      
      switch (status) {
        case 'available':
          result = await this.doctorAvailability.setDoctorAvailable(doctorId, location);
          break;
        case 'busy':
          result = await this.doctorAvailability.setDoctorBusy(
            doctorId, 
            activity, 
            estimated_free_time
          );
          break;
        default:
          result = await this.doctorAvailability.updateDoctorStatus(doctorId, status, {
            current_location: location,
            current_activity: activity,
            estimated_free_time
          });
      }

      // Emit doctor status update
      if (req.io) {
        req.io.emit('doctorStatusUpdate', {
          doctorId,
          status: result,
          message: `Doctor status updated to ${status}`,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Doctor availability updated successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all doctors availability
  async getAllDoctorsAvailability(req, res) {
    try {
      const doctorsStatus = await this.doctorAvailability.getAllDoctorsStatus();

      res.json({
        success: true,
        data: doctorsStatus,
        count: doctorsStatus.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get OT utilization statistics
  async getOTUtilizationStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const end = endDate || new Date().toISOString().split('T')[0];

      const stats = await this.operationTheatre.getOTUtilizationStats(start, end);

      res.json({
        success: true,
        data: stats,
        period: { startDate: start, endDate: end }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Check availability for scheduling
  async checkAvailability(req, res) {
    try {
      const { ot_id, doctor_id, date, start_time, end_time } = req.query;

      const [otAvailable, doctorAvailable] = await Promise.all([
        ot_id ? this.otSchedule.checkOTAvailability(ot_id, date, start_time, end_time) : true,
        doctor_id ? this.otSchedule.checkDoctorAvailability(doctor_id, date, start_time, end_time) : true
      ]);

      res.json({
        success: true,
        data: {
          ot_available: otAvailable,
          doctor_available: doctorAvailable,
          overall_available: otAvailable && doctorAvailable
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Initialize daily availability for all doctors
  async initializeDailyAvailability(req, res) {
    try {
      const { date } = req.body;
      const result = await this.doctorAvailability.initializeDailyAvailability(date);

      res.json({
        success: true,
        message: 'Daily availability initialized successfully',
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Basic OT Management CRUD Operations
  
  // Get all operation theatres
  async getAllOTs(req, res) {
    try {
      const ots = await this.operationTheatre.getAllOTsWithStatus();
      // Map to include doctor_name, assignment_date, assignment_time in response (if not already present)
      const formatted = ots.map(ot => ({
        ...ot,
        doctor_name: ot.doctor_name || null,
        assignment_date: ot.assignment_date || null,
        assignment_time: ot.assignment_time || null
      }));
  res.json({ data: formatted });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get OTs assigned to the logged-in doctor
  async getAssignedOTs(req, res) {
    try {
      const doctorId = req.user && req.user.id;
      if (!doctorId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      const ots = await this.operationTheatre.getAssignedOTs(doctorId);
      res.json({ data: ots });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // Get OT by ID
  async getOTById(req, res) {
    try {
      const { otId } = req.params;
      const ot = await this.operationTheatre.findById(otId);
      
      if (!ot) {
        return res.status(404).json({
          success: false,
          message: 'Operation theatre not found'
        });
      }

      res.json({
        success: true,
        data: ot
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Create new operation theatre
  async createOT(req, res) {
    try {
      // Only include necessary fields, let database handle timestamps
      const { ot_number, status, theatre, current_procedure, surgery_type } = req.body;

      // Validate required fields
      if (!ot_number || !theatre) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: ot_number and theatre are required.'
        });
      }

      const otData = {
        ot_number,
        status: status || 'available',
        theatre,
        current_procedure,
        surgery_type
      };

      const newOT = await this.operationTheatre.create(otData);

      res.status(201).json({
        success: true,
        message: 'Operation theatre created successfully',
        data: newOT
      });
    } catch (error) {
      console.error('OT creation error:', error);
      console.error('Stack trace:', error.stack);
      res.status(400).json({
        success: false,
        message: error.message,
        details: 'Check server logs for more information'
      });
    }
  }

  // Update operation theatre
  async updateOT(req, res) {
    try {
      const { otId } = req.params;
      const updateData = {
        ...req.body,
        updated_at: new Date()
      };

      const updatedOT = await this.operationTheatre.update(otId, updateData);

      if (!updatedOT) {
        return res.status(404).json({
          success: false,
          message: 'Operation theatre not found'
        });
      }

      res.json({
        success: true,
        message: 'Operation theatre updated successfully',
        data: updatedOT
      });
    } catch (error) {
      console.error('Error in updateOT:', error);
      console.error('Error stack:', error.stack);
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Complete operation theatre (for doctors)
  async completeOT(req, res) {
    try {
      const { otId } = req.params;
      const doctorId = req.user && req.user.id;

      if (!doctorId) {
        return res.status(401).json({ 
          success: false, 
          message: 'Unauthorized' 
        });
      }

      // Check if the OT is assigned to this doctor
      const ot = await this.operationTheatre.findById(otId);
      if (!ot) {
        return res.status(404).json({
          success: false,
          message: 'Operation theatre not found'
        });
      }

      if (ot.doctor_id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'You can only complete OTs assigned to you'
        });
      }

      // Update OT to available status and clear assignment
      const updateData = {
        status: 'available',
        doctor_id: null,
        assignment_date: null,
        assignment_time: null,
        updated_at: new Date()
      };

      const updatedOT = await this.operationTheatre.update(otId, updateData);

      // Emit real-time update
      if (req.io) {
        req.io.emit('otCompleted', {
          otId,
          otNumber: ot.ot_number,
          doctorId,
          message: `OT ${ot.ot_number} completed and is now available`,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'Operation theatre completed successfully',
        data: updatedOT
      });
    } catch (error) {
      console.error('Error in completeOT:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete operation theatre
  async deleteOT(req, res) {
    try {
      const { otId } = req.params;
      
      // Check if OT has any active schedules
      const activeSchedules = await this.otSchedule.getActiveSchedulesByOT(otId);
      if (activeSchedules && activeSchedules.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete operation theatre with active schedules'
        });
      }

      const deleted = await this.operationTheatre.delete(otId);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Operation theatre not found'
        });
      }

      res.json({
        success: true,
        message: 'Operation theatre deleted successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update OT status (busy/maintenance/available)
  async updateOTStatus(req, res) {
    try {
      const { otId } = req.params;
      const { status, doctor_id, notes } = req.body;

      // Validate status
      const allowedStatuses = [
        'available', 'scheduled', 'in-use', 'cleaning', 'maintenance',
        'emergency', 'completed', 'cancelled'
      ];
      if (!status || !allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status value. Allowed values: ${allowedStatuses.join(', ')}`
        });
      }

      const updatedOT = await this.operationTheatre.updateOTStatus(otId, status, {
        doctor_id,
        notes,
        updated_at: new Date()
      });

      // Emit real-time status update
      if (req.io) {
        req.io.emit('otStatusUpdate', {
          otId,
          status,
          ot: updatedOT,
          message: `OT ${updatedOT.ot_number} status updated to ${status}`,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        message: 'OT status updated successfully',
        data: updatedOT
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new OTController();
