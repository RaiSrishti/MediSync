const BaseModel = require('./BaseModel');
const bcrypt = require('bcryptjs');

class User extends BaseModel {
  constructor() {
    super('users');
  }

  // Create new user with hashed password
  async createUser(data) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'patient',
      department_id: data.department_id || null,
      refresh_token: null,
      // Staff members need approval (except patients and existing admins)
      is_approved: data.role === 'patient' || data.role === 'admin',
      status: data.role === 'patient' || data.role === 'admin' ? 'approved' : 'pending'
    };
    const result = await this.db(this.table).insert(user);
    const id = result[0]; // MySQL returns inserted ID as first element
    return this._sanitizeUser(await this.findById(id));
  }

  // Verify password and return user if match
  async verifyPassword(email, enteredPassword) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    const isMatch = await bcrypt.compare(enteredPassword, user.password);
    return isMatch ? this._sanitizeUser(user) : false;
  }

  // Find user by email
  async findByEmail(email) {
    return this.db(this.table).where({ email }).first();
  }

  // Find users by role
  async findByRole(role) {
    return this.db(this.table).where({ role });
  }

  // Find pending staff members for approval
  async findPendingStaff() {
    return this.db(this.table)
      .where({ status: 'pending' })
      .whereIn('role', ['doctor', 'nurse', 'receptionist', 'pharmacist']);
  }

  // Find all staff members (including pending and approved)
  async findAllStaff() {
    return this.db(this.table)
      .whereIn('role', ['doctor', 'nurse', 'receptionist', 'pharmacist'])
      .orderBy('status', 'asc')
      .orderBy('name', 'asc');
  }

  // Find approved staff members by role
  async findApprovedStaffByRole(role) {
    return this.db(this.table)
      .where({ role, status: 'approved' });
  }

  // Approve a staff member
  async approveStaff(userId, adminId) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    if (!['doctor', 'nurse', 'receptionist', 'pharmacist'].includes(user.role)) {
      throw new Error('Only staff members can be approved');
    }

    return await this.update(userId, {
      is_approved: true,
      status: 'approved',
      approved_by: adminId,
      approved_at: new Date()
    });
  }

  // Reject a staff member (delete from database)
  async rejectStaff(userId, adminId, reason) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');
    
    if (!['doctor', 'nurse', 'receptionist', 'pharmacist'].includes(user.role)) {
      throw new Error('Only staff members can be rejected');
    }

    // Log the rejection before deletion (optional: you could save to a separate audit table)
    console.log(`Staff member rejected and deleted: ${user.name} (${user.email}) by admin ${adminId}. Reason: ${reason}`);

    // Delete the user from database
    await this.delete(userId);
    
    // Return user info for response
    return {
      ...user,
      deleted: true,
      rejection_reason: reason
    };
  }

  // Suspend a staff member
  async suspendStaff(userId, adminId, reason) {
    const user = await this.findById(userId);
    if (!user) throw new Error('User not found');

    return await this.update(userId, {
      status: 'suspended',
      approved_by: adminId,
      approved_at: new Date(),
      rejection_reason: reason
    });
  }

  // Store hashed refresh token in DB
  async updateRefreshToken(userId, hashedRefreshToken) {
    await this.db(this.table)
      .where({ id: userId })
      .update({ refresh_token: hashedRefreshToken });
  }

  // Find user by hashed refresh token
  async findByRefreshToken(hashedRefreshToken) {
    return this.db(this.table)
      .where({ refresh_token: hashedRefreshToken })
      .first();
  }

  // Remove refresh token by user ID
  async clearRefreshToken(userId) {
    await this.db(this.table)
      .where({ id: userId })
      .update({ refresh_token: null });
  }

  // Remove refresh token by hashed token (useful for logout without user ID)
  async clearRefreshTokenByHashed(hashedRefreshToken) {
    await this.db(this.table)
      .where({ refresh_token: hashedRefreshToken })
      .update({ refresh_token: null });
  }

  // Internal: Remove password before returning user object
  _sanitizeUser(user) {
    if (!user) return null;
    const { password, ...rest } = user;
    return rest;
  }

  // Public method to sanitize user data
  sanitizeUser(user) {
    return this._sanitizeUser(user);
  }
}

module.exports = User;
