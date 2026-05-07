// Test script to create sample tokens for debugging
const knex = require('knex');
const config = require('../knexfile');

const db = knex(config.development);

async function createTestTokens() {
  try {
    console.log('Creating test tokens...');

    // Check if we have test data already
    const existingTokens = await db('tokens')
      .whereRaw('DATE(created_at) = CURDATE()')
      .count('* as count');

    if (existingTokens[0].count > 0) {
      console.log(`Found ${existingTokens[0].count} existing tokens for today`);
      const tokens = await db('tokens')
        .whereRaw('DATE(created_at) = CURDATE()')
        .orderBy('token_number', 'asc');
      console.log('Existing tokens:', tokens);
      return;
    }

    // Get first department
    const department = await db('departments').first();
    if (!department) {
      console.log('No departments found. Please run createDepartments.js first');
      return;
    }

    // Get first patient
    const patient = await db('patients').first();
    if (!patient) {
      console.log('No patients found. Creating a test patient...');
      const [patientId] = await db('patients').insert({
        name: 'Test Patient',
        age: 30,
        gender: 'male',
        phone_number: '1234567890',
        address: 'Test Address',
        created_at: new Date()
      });
      console.log('Created test patient with ID:', patientId);
    }

    // Get first doctor
    const doctor = await db('users')
      .where('role', 'doctor')
      .where('department_id', department.id)
      .first();

    // Create test tokens
    const testTokens = [
      {
        token_number: 1,
        patient_id: patient?.id || 1,
        department_id: department.id,
        doctor_id: doctor?.id || null,
        status: 'waiting',
        priority: 0,
        created_at: new Date(),
        date: new Date().toISOString().split('T')[0]
      },
      {
        token_number: 2,
        patient_id: patient?.id || 1,
        department_id: department.id,
        doctor_id: doctor?.id || null,
        status: 'in-progress',
        priority: 0,
        created_at: new Date(),
        date: new Date().toISOString().split('T')[0]
      },
      {
        token_number: 3,
        patient_id: patient?.id || 1,
        department_id: department.id,
        doctor_id: doctor?.id || null,
        status: 'completed',
        priority: 0,
        created_at: new Date(),
        date: new Date().toISOString().split('T')[0],
        actual_service_time: new Date()
      }
    ];

    for (const token of testTokens) {
      const [tokenId] = await db('tokens').insert(token);
      console.log(`Created token ${token.token_number} with ID: ${tokenId}`);
    }

    console.log('Test tokens created successfully!');

  } catch (error) {
    console.error('Error creating test tokens:', error);
  } finally {
    await db.destroy();
  }
}

if (require.main === module) {
  createTestTokens();
}

module.exports = createTestTokens;
