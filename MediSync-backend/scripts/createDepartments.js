// Script to create basic hospital departments

const knex = require('knex');
const config = require('../knexfile');

const db = knex(config.development);

const departments = [
  {
    name: 'Emergency',
    description: 'Emergency medical services and trauma care'
  },
  {
    name: 'General Medicine',
    description: 'General medical consultations and treatments'
  },
  {
    name: 'Surgery',
    description: 'Surgical procedures and operations'
  },
  {
    name: 'Pediatrics',
    description: 'Child healthcare and medical services'
  },
  {
    name: 'Orthopedics',
    description: 'Bone, joint, and muscle treatments'
  },
  {
    name: 'Radiology',
    description: 'Medical imaging and diagnostic services'
  },
  {
    name: 'Laboratory',
    description: 'Medical testing and pathology services'
  },
  {
    name: 'Pharmacy',
    description: 'Medicine dispensing and pharmaceutical care'
  }
];

async function createDepartments() {
  try {
    console.log('Creating hospital departments...');
    
    for (const dept of departments) {
      // Check if department already exists
      const existing = await db('departments').where('name', dept.name).first();
      
      if (!existing) {
        const [id] = await db('departments').insert(dept);
        console.log(`✓ Created department: ${dept.name} (ID: ${id})`);
      } else {
        console.log(`- Department already exists: ${dept.name} (ID: ${existing.id})`);
      }
    }
    
    // Display all departments
    console.log('\nAll departments:');
    const allDepts = await db('departments').select('id', 'name', 'description');
    allDepts.forEach(dept => {
      console.log(`  ${dept.id}. ${dept.name} - ${dept.description}`);
    });
    
  } catch (error) {
    console.error('Error creating departments:', error);
  } finally {
    await db.destroy();
  }
}

createDepartments();
