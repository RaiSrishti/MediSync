// models/Department.js
const BaseModel = require('./BaseModel');

class Department extends BaseModel {
  constructor() {
    super('departments');
  }

  // Helper method to safely parse JSON fields
  static parseStaffField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    try {
      return JSON.parse(field);
    } catch (error) {
      console.error('Error parsing staff field:', error);
      return [];
    }
  }

  // Helper method to stringify staff arrays for database storage
  static stringifyStaffField(field) {
    if (!field || !Array.isArray(field)) return JSON.stringify([]);
    return JSON.stringify(field);
  }

  // Add a doctor to a department
  async addDoctor(departmentId, doctorId) {
    const department = await this.findById(departmentId);
    if (!department) throw new Error('Department not found');

    const doctors = Department.parseStaffField(department.doctors);
    if (!doctors.includes(doctorId)) {
      doctors.push(doctorId);
      return await this.update(departmentId, {
        doctors: Department.stringifyStaffField(doctors)
      });
    }
    return department;
  }

  // Remove a doctor from a department
  async removeDoctor(departmentId, doctorId) {
    const department = await this.findById(departmentId);
    if (!department) throw new Error('Department not found');

    const doctors = Department.parseStaffField(department.doctors);
    const filteredDoctors = doctors.filter(id => id !== doctorId);
    
    return await this.update(departmentId, {
      doctors: Department.stringifyStaffField(filteredDoctors)
    });
  }

  // Add a nurse to a department
  async addNurse(departmentId, nurseId) {
    const department = await this.findById(departmentId);
    if (!department) throw new Error('Department not found');

    const nurses = Department.parseStaffField(department.nurses);
    if (!nurses.includes(nurseId)) {
      nurses.push(nurseId);
      return await this.update(departmentId, {
        nurses: Department.stringifyStaffField(nurses)
      });
    }
    return department;
  }

  // Remove a nurse from a department
  async removeNurse(departmentId, nurseId) {
    const department = await this.findById(departmentId);
    if (!department) throw new Error('Department not found');

    const nurses = Department.parseStaffField(department.nurses);
    const filteredNurses = nurses.filter(id => id !== nurseId);
    
    return await this.update(departmentId, {
      nurses: Department.stringifyStaffField(filteredNurses)
    });
  }

  // Get department with populated staff information
  async getDepartmentWithStaff(departmentId) {
    const department = await this.findById(departmentId);
    if (!department) return null;

    // Parse JSON fields
    department.doctors = Department.parseStaffField(department.doctors);
    department.nurses = Department.parseStaffField(department.nurses);

    return department;
  }

  // Get all departments with populated staff
  async getAllWithStaff() {
    const departments = await this.findAll();
    return departments.map(dept => ({
      ...dept,
      doctors: Department.parseStaffField(dept.doctors),
      nurses: Department.parseStaffField(dept.nurses)
    }));
  }

  // Get available doctors for a department
  async getDepartmentDoctors(departmentId) {
    try {
      return await this.db('users')
        .where('department_id', departmentId)
        .where('role', 'doctor')
        .where('status', 'approved')
        .select('id', 'name', 'email')
        .orderBy('name', 'asc');
    } catch (error) {
      console.error('Error getting department doctors:', error);
      return [];
    }
  }
}

module.exports = Department;
