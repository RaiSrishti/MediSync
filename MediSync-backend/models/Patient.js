// models/Patient.js

const BaseModel = require('./BaseModel');

class Patient extends BaseModel {
  constructor() {
    super('patients');
  }

  // Helper method to stringify JSON fields
  static stringifyJsonField(field) {
    if (!field) return JSON.stringify([]);
    if (typeof field === 'string') return field;
    return JSON.stringify(field);
  }

  // Helper method to safely parse JSON fields
  static parseJsonField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === 'object') return field;
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error('Error parsing JSON field:', error);
      return [];
    }
  }

  // Find patient by email or phone
  async findByEmailOrPhone(email, phone) {
    const query = this.db(this.table);
    
    if (email && phone) {
      return query.where('email', email).orWhere('phone_number', phone).first();
    } else if (email) {
      return query.where('email', email).first();
    } else if (phone) {
      return query.where('phone_number', phone).first();
    }
    
    return null;
  }

  // Find unlinked patient by email (created by staff but not linked to user)
  async findUnlinkedByEmail(email) {
    return this.db(this.table)
      .where('email', email)
      .where('user_id', null)
      .where('created_by_staff', true)
      .first();
  }

  // Link patient to user account
  async linkToUser(patientId, userId) {
    return this.db(this.table)
      .where('id', patientId)
      .update({
        user_id: userId,
        is_linked: true,
        updated_at: this.db.fn.now()
      });
  }

  // Get patient profile by user ID
  async getByUserId(userId) {
    return this.db(this.table)
      .where('user_id', userId)
      .first();
  }

  // Alias for getByUserId for consistency
  async findByUserId(userId) {
    return this.getByUserId(userId);
  }

  // Create patient with creator tracking
  async createPatient(data, createdBy = null) {
    const patientData = {
      ...data,
      created_by: createdBy,
      created_by_staff: createdBy ? true : false,
      is_linked: data.user_id ? true : false
    };

    const result = await this.db(this.table).insert(patientData);
    const id = result[0];
    return this.findById(id);
  }

  // Get patients created by specific staff member
  async getByCreator(creatorId) {
    return this.db(this.table)
      .where('created_by', creatorId)
      .orderBy('created_at', 'desc');
  }

  // Update patient with field restrictions
  async updatePatient(patientId, data, userRole, userId) {
    // Define which fields each role can update
    const allowedFields = {
      patient: ['age', 'gender', 'blood_group', 'phone_number', 'address', 'emergency_contact'], // Allow edit except name
      receptionist: ['name', 'age', 'gender', 'blood_group', 'phone_number', 'address', 'emergency_contact'],
      nurse: ['name', 'age', 'gender', 'blood_group', 'phone_number', 'address', 'emergency_contact', 'allergies'],
      doctor: ['name', 'age', 'gender', 'blood_group', 'phone_number', 'address', 'medical_history', 'current_medications', 'allergies', 'emergency_contact'],
      admin: ['name', 'age', 'gender', 'blood_group', 'phone_number', 'address', 'medical_history', 'current_medications', 'allergies', 'emergency_contact', 'email']
    };

    // Filter data based on role permissions
    const roleAllowedFields = allowedFields[userRole] || [];
    const filteredData = {};
    
    for (const field of roleAllowedFields) {
      if (data.hasOwnProperty(field)) {
        let value = data[field];
        // Convert empty string to null for nullable fields
        if ((field === 'age' || field === 'gender' || field === 'phone_number' || field === 'blood_group' || field === 'address') && value === '') {
          value = null;
        }
        // Stringify JSON fields if needed
        if (field === 'emergency_contact' && value && typeof value === 'object') {
          filteredData[field] = JSON.stringify(value);
        } else {
          filteredData[field] = value;
        }
      }
    }

    // Add updated timestamp
    filteredData.updated_at = this.db.fn.now();

    // Perform update
    await this.db(this.table).where('id', patientId).update(filteredData);
    return this.findById(patientId);
  }

  // Update patient medical details during consultation (Doctors only)
  async updateMedicalDetails(patientId, medicalData, doctorId) {
    // Medical fields that doctors can update during consultation
    const medicalFields = [
      'medical_history',
      'current_medications', 
      'allergies',
      'diagnosis',
      'treatment_plan',
      'notes'
    ];

    const filteredData = {};
    for (const field of medicalFields) {
      if (medicalData.hasOwnProperty(field)) {
        filteredData[field] = Patient.stringifyJsonField(medicalData[field]);
      }
    }

    // Add consultation tracking
    filteredData.last_consultation_date = this.db.fn.now();
    filteredData.last_consulted_by = doctorId;
    filteredData.updated_at = this.db.fn.now();

    await this.db(this.table).where('id', patientId).update(filteredData);
    return this.findById(patientId);
  }

  // Get patient consultation history
  async getConsultationHistory(patientId) {
    // Get all tokens for this patient with consultation details
    return this.db('tokens')
      .join('departments', 'tokens.department_id', 'departments.id')
      .select(
        'tokens.id as token_id',
        'tokens.token_number',
        'tokens.created_at as visit_date',
        'tokens.actual_service_time',
        'tokens.status',
        'departments.name as department_name'
      )
      .where('tokens.patient_id', patientId)
      .where('tokens.status', 'completed')
      .orderBy('tokens.created_at', 'desc');
  }

  // Get patients who have visited a specific department
  async getByDepartment(departmentId) {
    try {
      // Get patients who have tokens for this department
      const patients = await this.db(this.table)
        .distinct('patients.*')
        .join('tokens', 'patients.id', 'tokens.patient_id')
        .where('tokens.department_id', departmentId)
        .orderBy('patients.name', 'asc');
      
      return patients;
    } catch (error) {
      console.error('Error getting patients by department:', error);
      return [];
    }
  }

  // Search patients by name, phone, or ID
  async searchPatients(searchTerm) {
    try {
      const patients = await this.db(this.table)
        .where(function() {
          this.where('name', 'like', `%${searchTerm}%`)
              .orWhere('phone_number', 'like', `%${searchTerm}%`)
              .orWhere('email', 'like', `%${searchTerm}%`)
              .orWhere('id', 'like', `%${searchTerm}%`);
        })
        .orderBy('name', 'asc')
        .limit(50); // Limit results for performance
      
      return patients;
    } catch (error) {
      console.error('Error searching patients:', error);
      return [];
    }
  }

  // Get patient medications/prescriptions
  async getPatientMedications(patientId) {
    try {
      // This would typically join with prescriptions table
      // For now, we'll return current medications from patient record
      // and any prescription history if available
      
      const patient = await this.findById(patientId);
      if (!patient) {
        return [];
      }

      // Parse current medications
      const currentMeds = Patient.parseJsonField(patient.current_medications);
      
      // If we have a prescriptions table, we could also fetch from there
      // For now, returning formatted current medications
      return currentMeds.map((med, index) => ({
        id: `current_${index}`,
        drug_name: med.drug_name || med.name || 'Unknown',
        brand: med.brand || 'Generic',
        dosage: med.dosage || med.dose || 'As prescribed',
        instructions: med.instructions || 'Follow doctor\'s advice',
        prescribed_date: patient.created_at,
        doctor_name: 'Prescribing Doctor',
        status: 'active',
        duration: med.duration || null
      }));
    } catch (error) {
      console.error('Error getting patient medications:', error);
      return [];
    }
  }
}

module.exports = Patient;