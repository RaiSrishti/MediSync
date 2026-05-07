const knex = require('knex')(require('../knexfile')[process.env.NODE_ENV || 'development']);

async function createSampleDrugs() {
  try {
    // Check if drugs already exist
    const existingDrugs = await knex('drugs').select('*').limit(1);
    
    if (existingDrugs.length > 0) {
      console.log('Drugs already exist in the database');
      return;
    }

    console.log('Creating sample drugs...');
    
    const sampleDrugs = [
      {
        name: 'Paracetamol 500mg',
        generic_name: 'Acetaminophen',
        category: 'Analgesics',
        description: 'Pain reliever and fever reducer',
        manufacturer: 'PharmaCorp',
        current_stock: 500,
        minimum_stock: 50,
        unit: 'tablets',
        unit_price: 0.50,
        expiry_date: '2026-12-31',
        location: 'Shelf A-1',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Amoxicillin 250mg',
        generic_name: 'Amoxicillin',
        category: 'Antibiotics',
        description: 'Broad spectrum antibiotic',
        manufacturer: 'MediPharma',
        current_stock: 200,
        minimum_stock: 30,
        unit: 'capsules',
        unit_price: 1.25,
        expiry_date: '2026-08-15',
        location: 'Shelf B-3',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Lisinopril 10mg',
        generic_name: 'Lisinopril',
        category: 'Cardiovascular',
        description: 'ACE inhibitor for hypertension',
        manufacturer: 'HeartMed',
        current_stock: 150,
        minimum_stock: 25,
        unit: 'tablets',
        unit_price: 2.00,
        expiry_date: '2026-10-20',
        location: 'Shelf C-2',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Insulin Regular',
        generic_name: 'Human Insulin',
        category: 'Endocrine',
        description: 'Short-acting insulin for diabetes',
        manufacturer: 'DiabetesCare',
        current_stock: 8,
        minimum_stock: 10,
        unit: 'vials',
        unit_price: 25.00,
        expiry_date: '2025-12-01',
        location: 'Refrigerator R-1',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Ibuprofen 400mg',
        generic_name: 'Ibuprofen',
        category: 'Analgesics',
        description: 'Non-steroidal anti-inflammatory drug',
        manufacturer: 'PainRelief Inc',
        current_stock: 300,
        minimum_stock: 40,
        unit: 'tablets',
        unit_price: 0.75,
        expiry_date: '2026-09-30',
        location: 'Shelf A-2',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Atorvastatin 20mg',
        generic_name: 'Atorvastatin',
        category: 'Cardiovascular',
        description: 'Cholesterol lowering medication',
        manufacturer: 'CholesterolCare',
        current_stock: 5,
        minimum_stock: 15,
        unit: 'tablets',
        unit_price: 3.50,
        expiry_date: '2026-11-15',
        location: 'Shelf C-1',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Omeprazole 20mg',
        generic_name: 'Omeprazole',
        category: 'Gastrointestinal',
        description: 'Proton pump inhibitor for acid reflux',
        manufacturer: 'GastroMed',
        current_stock: 100,
        minimum_stock: 20,
        unit: 'capsules',
        unit_price: 1.80,
        expiry_date: '2026-07-25',
        location: 'Shelf D-1',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Metformin 500mg',
        generic_name: 'Metformin',
        category: 'Endocrine',
        description: 'First-line medication for type 2 diabetes',
        manufacturer: 'DiabetesCare',
        current_stock: 250,
        minimum_stock: 35,
        unit: 'tablets',
        unit_price: 0.90,
        expiry_date: '2026-06-10',
        location: 'Shelf E-1',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Aspirin 81mg',
        generic_name: 'Aspirin',
        category: 'Cardiovascular',
        description: 'Low-dose aspirin for heart protection',
        manufacturer: 'CardioProtect',
        current_stock: 400,
        minimum_stock: 50,
        unit: 'tablets',
        unit_price: 0.25,
        expiry_date: '2027-01-15',
        location: 'Shelf A-3',
        is_available: true,
        last_updated: new Date()
      },
      {
        name: 'Morphine 10mg',
        generic_name: 'Morphine Sulfate',
        category: 'Controlled Substances',
        description: 'Strong pain medication for severe pain',
        manufacturer: 'PainControl Ltd',
        current_stock: 3,
        minimum_stock: 5,
        unit: 'vials',
        unit_price: 15.00,
        expiry_date: '2025-11-30',
        location: 'Controlled Vault V-1',
        is_available: true,
        last_updated: new Date()
      }
    ];

    await knex('drugs').insert(sampleDrugs);
    
    console.log('✅ Sample drugs created successfully!');
    
    // Verify creation
    const createdDrugs = await knex('drugs').select('*');
    console.log(`Total drugs created: ${createdDrugs.length}`);
    
    // Show low stock items
    const lowStockDrugs = await knex('drugs')
      .where('current_stock', '<', knex.raw('minimum_stock'))
      .select('name', 'current_stock', 'minimum_stock');
    
    console.log(`\nLow stock alerts (${lowStockDrugs.length}):`);
    lowStockDrugs.forEach(drug => {
      console.log(`⚠️  ${drug.name}: ${drug.current_stock} (min: ${drug.minimum_stock})`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample drugs:', error.message);
  } finally {
    await knex.destroy();
  }
}

createSampleDrugs();
