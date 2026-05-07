// models/Token.js

const BaseModel = require('./BaseModel');
const SystemSettings = require('./SystemSettings');

class Token extends BaseModel {
  constructor() {
    super('tokens');
    this.systemSettings = new SystemSettings();
  }

  // Find doctor with least tokens in a department for load balancing
  async findDoctorWithLeastTokens(departmentId) {
    try {
      const result = await this.db.raw(`
        SELECT 
          u.id as doctor_id,
          u.name as doctor_name,
          COALESCE(token_counts.token_count, 0) as current_tokens
        FROM users u
        LEFT JOIN (
          SELECT 
            doctor_id,
            COUNT(*) as token_count
          FROM tokens 
          WHERE department_id = ? 
            AND DATE(created_at) = CURDATE()
            AND status IN ('waiting', 'in-progress')
          GROUP BY doctor_id
        ) token_counts ON u.id = token_counts.doctor_id
        WHERE u.department_id = ? 
          AND u.role = 'doctor'
          AND u.status = 'approved'
        ORDER BY current_tokens ASC, RAND()
        LIMIT 1
      `, [departmentId, departmentId]);

      return result[0][0] || null;
    } catch (error) {
      console.error('Error finding doctor with least tokens:', error);
      return null;
    }
  }

  async generate(patientId, departmentId, doctorId = null) {
    // Check if token generation is allowed at current time
    const timeCheck = await this.systemSettings.isTokenGenerationAllowed();
    if (!timeCheck.allowed) {
      throw new Error(timeCheck.message);
    }

    return await this.db.transaction(async (trx) => {
      let attempts = 0;
      const maxAttempts = 3;
      
      // If no doctor specified, auto-assign to doctor with least tokens
      if (!doctorId) {
        const assignedDoctor = await this.findDoctorWithLeastTokens(departmentId);
        if (assignedDoctor) {
          doctorId = assignedDoctor.doctor_id;
          
        }
      }
      
      while (attempts < maxAttempts) {
        try {
          // Use the 'date' column for today's tokens
          const result = await trx.raw(`
            SELECT COALESCE(MAX(token_number), 0) + 1 as next_token
            FROM tokens
            WHERE department_id = ? AND date = CURDATE()
            FOR UPDATE
          `, [departmentId]);
          const nextTokenNumber = result[0][0].next_token;
          const tokenData = {
            patient_id: patientId,
            department_id: departmentId,
            doctor_id: doctorId,
            token_number: nextTokenNumber,
            status: 'waiting',
            priority: 0,
            date: trx.raw('CURDATE()'),
            created_at: trx.fn.now()
          };
          const insertResult = await trx(this.table).insert(tokenData);
          // Fetch the inserted token using the transaction
          const token = await trx(this.table).where({ id: insertResult[0] }).first();
          return token;
        } catch (error) {
          attempts++;
          if (error.code === 'ER_DUP_ENTRY' && attempts < maxAttempts) {
            console.log(`Token generation with doctor attempt ${attempts} failed due to duplicate entry, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 10));
            continue;
          }
          console.error('Error generating token with doctor:', error);
          throw error;
        }
      }
      throw new Error('Failed to generate token with doctor after maximum attempts');
    });
  }

  // Get active token for patient (today only)
  async getActiveTokenForPatient(patientId) {
    try {
      return await this.db(this.table)
        .where('patient_id', patientId)
        .whereIn('status', ['waiting', 'in-progress'])
        .whereRaw('DATE(created_at) = CURDATE()')
        .first();
    } catch (error) {
      console.error('Error getting active token:', error);
      return null;
    }
  }

  // Get token with full details
  async getTokenWithDetails(tokenId) {
    try {
      return await this.db(this.table)
        .join('departments', 'tokens.department_id', 'departments.id')
        .leftJoin('users as doctors', 'tokens.doctor_id', 'doctors.id')
        .select(
          'tokens.*',
          'departments.name as department_name',
          'doctors.name as doctor_name'
        )
        .where('tokens.id', tokenId)
        .first();
    } catch (error) {
      console.error('Error getting token details:', error);
      return null;
    }
  }

  // Get patient's tokens
  async getPatientTokens(patientId, status = null, limit = 10) {
    try {
      let query = this.db(this.table)
        .join('departments', 'tokens.department_id', 'departments.id')
        .leftJoin('users as doctors', 'tokens.doctor_id', 'doctors.id')
        .select(
          'tokens.*',
          'departments.name as department_name',
          'doctors.name as doctor_name'
        )
        .where('tokens.patient_id', patientId)
        .orderBy('tokens.created_at', 'desc')
        .limit(limit);

      if (status) {
        query = query.where('tokens.status', status);
      }

      return await query;
    } catch (error) {
      console.error('Error getting patient tokens:', error);
      return [];
    }
  }

  // Delete old tokens automatically (called by scheduler)
  async deleteOldTokens() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 1); // Yesterday
      
      const result = await this.db(this.table)
        .where('date', '<', cutoffDate.toISOString().split('T')[0])
        .del();

      return result;
    } catch (error) {
      console.error('Error deleting old tokens:', error);
      throw error;
    }
  }

  // Get token generation time window info
  async getTokenTimeInfo() {
    try {
      return await this.systemSettings.getTokenTimeWindow();
    } catch (error) {
      console.error('Error getting token time info:', error);
      return {
        startTime: '07:00',
        endTime: '20:00',
        enabled: false
      };
    }
  }

  // Get department queue with tokens for display
  async getDepartmentQueue(departmentId, doctorId = null) {
    try {
      let query = `
        SELECT 
          t.*,
          p.name as patient_name,
          p.phone_number as patient_phone,
          p.age as patient_age,
          u.name as doctor_name
        FROM tokens t
        LEFT JOIN patients p ON t.patient_id = p.id
        LEFT JOIN users u ON t.doctor_id = u.id
        WHERE t.department_id = ?
          AND DATE(t.created_at) = CURDATE()
          AND t.status IN ('waiting', 'in-progress')
      `;

      const params = [departmentId];

      if (doctorId) {
        query += ` AND t.doctor_id = ?`;
        params.push(doctorId);
      }

      query += ` ORDER BY t.token_number ASC`;

      const result = await this.db.raw(query, params);
      return result[0] || [];
    } catch (error) {
      console.error('Error getting department queue:', error);
      return [];
    }
  }

  // Get all today's tokens for a department (including completed, no-show, etc.)
  async getAllTodayTokens(departmentId, doctorId = null) {
    try {
      let query = `
        SELECT 
          t.*,
          p.name as patient_name,
          p.phone_number as patient_phone,
          p.age as patient_age,
          u.name as doctor_name
        FROM tokens t
        LEFT JOIN patients p ON t.patient_id = p.id
        LEFT JOIN users u ON t.doctor_id = u.id
        WHERE t.department_id = ?
          AND DATE(t.created_at) = CURDATE()
      `;

      const params = [departmentId];

      if (doctorId) {
        query += ` AND t.doctor_id = ?`;
        params.push(doctorId);
      }

      query += ` ORDER BY t.token_number ASC`;

      const result = await this.db.raw(query, params);
      return result[0] || [];
    } catch (error) {
      console.error('Error getting all today tokens:', error);
      return [];
    }
  }

  // Get today's statistics
  async getTodayStats(departmentId, doctorId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_tokens,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tokens,
          SUM(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) as waiting_tokens,
          SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) as in_progress_tokens,
          SUM(CASE WHEN status = 'no-show' THEN 1 ELSE 0 END) as no_show_tokens,
          AVG(CASE WHEN status = 'completed' AND actual_service_time IS NOT NULL 
              THEN TIMESTAMPDIFF(MINUTE, created_at, actual_service_time) 
              ELSE NULL END) as avg_consultation_time
        FROM tokens 
        WHERE department_id = ?
          AND DATE(created_at) = CURDATE()
      `;

      const params = [departmentId];

      if (doctorId) {
        query += ` AND doctor_id = ?`;
        params.push(doctorId);
      }

      const result = await this.db.raw(query, params);
      const stats = result[0][0] || {};
      
      return {
        total_tokens: parseInt(stats.total_tokens) || 0,
        completed_tokens: parseInt(stats.completed_tokens) || 0,
        waiting_tokens: parseInt(stats.waiting_tokens) || 0,
        in_progress_tokens: parseInt(stats.in_progress_tokens) || 0,
        no_show_tokens: parseInt(stats.no_show_tokens) || 0,
        avg_consultation_time: parseFloat(stats.avg_consultation_time) || 0
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return {
        total_tokens: 0,
        completed_tokens: 0,
        waiting_tokens: 0,
        in_progress_tokens: 0,
        no_show_tokens: 0,
        avg_consultation_time: 0
      };
    }
  }

  // Estimate wait time for new patients
  async estimateWaitTime(departmentId, doctorId = null) {
    try {
      const stats = await this.getTodayStats(departmentId, doctorId);
      const avgConsultationTime = stats.avg_consultation_time || 15; // Default 15 minutes
      const waitingTokens = stats.waiting_tokens || 0;
      
      return Math.max(waitingTokens * avgConsultationTime, 0);
    } catch (error) {
      console.error('Error estimating wait time:', error);
      return 0;
    }
  }

  // Generate token with specific doctor
  async generateWithDoctor(patientId, departmentId, doctorId) {
    try {
      // Check if token generation is allowed at current time
      const timeCheck = await this.systemSettings.isTokenGenerationAllowed();
      if (!timeCheck.allowed) {
        throw new Error(timeCheck.message);
      }

      // Check if patient already has an active token today
      const existingToken = await this.getActiveTokenForPatient(patientId);
      if (existingToken) {
        throw new Error('Patient already has an active token for today');
      }

      // If no doctor specified, auto-assign to doctor with least tokens
      if (!doctorId) {
        const assignedDoctor = await this.findDoctorWithLeastTokens(departmentId);
        if (assignedDoctor) {
          doctorId = assignedDoctor.doctor_id;
        }
      }

      // Get next token number for the department
      const result = await this.db.raw(`
        SELECT COALESCE(MAX(token_number), 0) + 1 as next_number 
        FROM tokens 
        WHERE department_id = ? AND DATE(created_at) = CURDATE()
      `, [departmentId]);

      const tokenNumber = result[0][0].next_number;

      // Create the token
      const tokenData = {
        patient_id: patientId,
        department_id: departmentId,
        doctor_id: doctorId,
        token_number: tokenNumber,
        status: 'waiting',
        created_at: new Date(),
        estimated_time: new Date(Date.now() + 30 * 60000) // 30 minutes from now
      };

      const insertResult = await this.db(this.table).insert(tokenData);
      const tokenId = insertResult[0]; // Get the actual ID
      return await this.getTokenWithDetails(tokenId);
    } catch (error) {
      console.error('Error generating token with doctor:', error);
      throw error;
    }
  }

  // Get current token with patient details for a doctor
  async getCurrentTokenWithPatient(departmentId, doctorId = null) {
    try {
      let query = `
        SELECT 
          t.*,
          t.patient_id as id,
          p.name,
          p.phone_number,
          p.age,
          p.gender,
          p.blood_group,
          p.medical_history,
          p.current_medications,
          p.allergies,
          p.emergency_contact,
          p.diagnosis,
          p.treatment_plan,
          p.notes,
          t.id as token_id,
          t.token_number,
          u.name as doctor_name
        FROM tokens t
        LEFT JOIN patients p ON t.patient_id = p.id
        LEFT JOIN users u ON t.doctor_id = u.id
        WHERE t.department_id = ?
          AND DATE(t.created_at) = CURDATE()
          AND t.status = 'in-progress'
      `;

      const params = [departmentId];

      if (doctorId) {
        query += ` AND t.doctor_id = ?`;
        params.push(doctorId);
      }

      query += ` ORDER BY t.created_at DESC LIMIT 1`;

      const result = await this.db.raw(query, params);
      return result[0][0] || null;
    } catch (error) {
      console.error('Error getting current token with patient:', error);
      return null;
    }
  }

  // Set token priority
  async setPriority(tokenId, priority) {
    try {
      await this.db(this.table)
        .where('id', tokenId)
        .update({ priority: priority });
      return await this.getTokenWithDetails(tokenId);
    } catch (error) {
      console.error('Error setting token priority:', error);
      throw error;
    }
  }

  // Update token status
  async updateStatus(tokenId, status, additionalData = {}) {
    try {
      const updateData = { 
        status, 
        ...additionalData 
      };

      if (status === 'in-progress') {
        updateData.actual_service_time = new Date();
      }

      await this.db(this.table)
        .where('id', tokenId)
        .update(updateData);
      
      return await this.getTokenWithDetails(tokenId);
    } catch (error) {
      console.error('Error updating token status:', error);
      throw error;
    }
  }

  // Call next token in queue
  async callNextToken(departmentId, doctorId = null) {
    try {
      let query = this.db(this.table)
        .where('department_id', departmentId)
        .where('status', 'waiting')
        .whereRaw('DATE(created_at) = CURDATE()');

      if (doctorId) {
        query = query.where('doctor_id', doctorId);
      }

      const nextToken = await query
        .orderBy('priority', 'desc')
        .orderBy('token_number', 'asc')
        .first();

      if (nextToken) {
        return await this.updateStatus(nextToken.id, 'in-progress');
      }

      return null;
    } catch (error) {
      console.error('Error calling next token:', error);
      throw error;
    }
  }

  // Complete token
  async completeToken(tokenId) {
    try {
      return await this.updateStatus(tokenId, 'completed', {
        actual_service_time: new Date()
      });
    } catch (error) {
      console.error('Error completing token:', error);
      throw error;
    }
  }

  // Mark token as no-show
  async markNoShow(tokenId) {
    try {
      return await this.updateStatus(tokenId, 'no-show');
    } catch (error) {
      console.error('Error marking token as no-show:', error);
      throw error;
    }
  }

  // Update token status (alias for updateStatus)
  async updateTokenStatus(tokenId, status, additionalData = {}) {
    return await this.updateStatus(tokenId, status, additionalData);
  }

  // Get token history for patient
  async getTokenHistory(patientId, limit = 10) {
    try {
      return await this.db(this.table)
        .join('departments', 'tokens.department_id', 'departments.id')
        .leftJoin('users as doctors', 'tokens.doctor_id', 'doctors.id')
        .select(
          'tokens.*',
          'departments.name as department_name',
          'doctors.name as doctor_name'
        )
        .where('tokens.patient_id', patientId)
        .orderBy('tokens.created_at', 'desc')
        .limit(limit);
    } catch (error) {
      console.error('Error getting token history:', error);
      return [];
    }
  }

  // Get doctor's current patients
  async getDoctorCurrentPatients(doctorId) {
    try {
      const result = await this.db.raw(`
        SELECT 
          t.*,
          p.name as patient_name,
          p.phone_number as patient_phone,
          p.age as patient_age,
          p.gender as patient_gender,
          p.blood_group as patient_blood_group,
          p.medical_history as patient_medical_history,
          p.current_medications as patient_medications,
          p.allergies as patient_allergies,
          d.name as department_name
        FROM tokens t
        LEFT JOIN patients p ON t.patient_id = p.id
        LEFT JOIN departments d ON t.department_id = d.id
        WHERE t.doctor_id = ?
          AND DATE(t.created_at) = CURDATE()
          AND t.status = 'in-progress'
        ORDER BY t.created_at DESC
        LIMIT 1
      `, [doctorId]);
      
      return result[0][0] || null;
    } catch (error) {
      console.error('Error getting doctor current patients:', error);
      return null;
    }
  }
}

module.exports = Token;
