exports.up = function(knex) {
  return knex.schema.createTable('doctor_availability', function(table) {
    table.increments('id').primary();
    
    // Doctor Reference
    table.integer('doctor_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    
    // Availability Information
    table.date('date').notNullable();
    table.time('start_time').notNullable();
    table.time('end_time').notNullable();
    
    // Status
    table.enu('status', [
      'available', 'busy', 'in_surgery', 'on_call', 'break', 
      'emergency', 'off_duty', 'unavailable'
    ]).defaultTo('available');
    
    // Current Activity
    table.string('current_activity');
    table.integer('current_ot_id').unsigned().references('id').inTable('operation_theatres').onDelete('SET NULL');
    table.integer('current_schedule_id').unsigned().references('id').inTable('ot_schedules').onDelete('SET NULL');
    
    // Emergency Availability
    table.boolean('available_for_emergency').defaultTo(true);
    table.json('emergency_specialties'); // Specialties for emergency
    table.integer('max_emergency_level').defaultTo(3); // Max emergency level they can handle
    
    // Contact Information
    table.string('contact_number');
    table.string('emergency_contact');
    table.string('current_location'); // Current location in hospital
    
    // Scheduling
    table.boolean('can_be_called').defaultTo(true);
    table.integer('estimated_free_time'); // in minutes
    table.datetime('next_available_time');
    
    // Administrative
    table.boolean('is_on_duty').defaultTo(true);
    table.datetime('last_updated').defaultTo(knex.fn.now());
    
    table.timestamps(true, true);
    
    // Indexes
    table.index(['doctor_id', 'date']);
    table.index(['status', 'available_for_emergency']);
    table.index(['date', 'status']);
    
    // Unique constraint for doctor per date
    table.unique(['doctor_id', 'date']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('doctor_availability');
};
