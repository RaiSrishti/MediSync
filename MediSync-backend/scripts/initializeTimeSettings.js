const knex = require('knex');
const config = require('../knexfile');
const env = process.env.NODE_ENV || 'development';
const db = knex(config[env]);

async function initializeTimeSettings() {
  try {
    console.log('Checking system_settings table...');
    
    // Check if system_settings table exists
    const tableExists = await db.schema.hasTable('system_settings');
    if (!tableExists) {
      console.log('Creating system_settings table...');
      await db.schema.createTable('system_settings', function(table) {
        table.increments('id').primary();
        table.string('setting_key').notNullable().unique();
        table.text('setting_value');
        table.string('description');
        table.boolean('is_active').defaultTo(true);
        table.timestamps(true, true);
      });
      console.log('system_settings table created successfully.');
    }

    // Initialize default time settings
    const defaultSettings = [
      {
        setting_key: 'token_time_restriction_enabled',
        setting_value: 'false',
        description: 'Enable/disable time restrictions for token generation'
      },
      {
        setting_key: 'token_generation_start_time',
        setting_value: '07:00',
        description: 'Start time for token generation (HH:MM format)'
      },
      {
        setting_key: 'token_generation_end_time',
        setting_value: '20:00',
        description: 'End time for token generation (HH:MM format)'
      }
    ];

    for (const setting of defaultSettings) {
      const exists = await db('system_settings')
        .where('setting_key', setting.setting_key)
        .first();

      if (!exists) {
        await db('system_settings').insert({
          ...setting,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        });
        console.log(`Inserted setting: ${setting.setting_key} = ${setting.setting_value}`);
      } else {
        console.log(`Setting already exists: ${setting.setting_key} = ${exists.setting_value}`);
      }
    }

    // Display current settings
    console.log('\nCurrent time settings:');
    const currentSettings = await db('system_settings')
      .whereIn('setting_key', [
        'token_time_restriction_enabled',
        'token_generation_start_time', 
        'token_generation_end_time'
      ])
      .where('is_active', true);

    currentSettings.forEach(setting => {
      console.log(`  ${setting.setting_key}: ${setting.setting_value}`);
    });

    console.log('\nTime settings initialization completed successfully!');
    
  } catch (error) {
    console.error('Error initializing time settings:', error);
  } finally {
    await db.destroy();
  }
}

initializeTimeSettings();
