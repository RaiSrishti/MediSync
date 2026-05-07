exports.up = function(knex) {
  return knex.schema.createTable('ot_schedules', function(table) {
    table.increments('id').primary();
    
    // Operation Theatre Reference
    table.integer('ot_id').unsigned().references('id').inTable('operation_theatres').onDelete('CASCADE');
    
    // Basic Schedule Information
    table.string('schedule_type').defaultTo('surgery'); // surgery, maintenance, cleaning, emergency
    table.string('procedure_name').notNullable();
    table.text('procedure_details');
    
    // Patient & Medical Team
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.integer('primary_surgeon_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('anesthesiologist_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
    
    // Additional Team Members (JSON array of user IDs)
    table.json('assisting_surgeons');
    table.json('nurses');
    table.json('technicians');
    
    // Schedule Timing
    table.datetime('scheduled_date').notNullable();
    table.time('scheduled_start_time').notNullable();
    table.time('scheduled_end_time').notNullable();
    table.integer('estimated_duration').notNullable(); // in minutes
    
    // Actual Timing
    table.datetime('actual_start_time');
    table.datetime('actual_end_time');
    table.integer('actual_duration'); // in minutes
    
    // Priority & Emergency
    table.enu('priority', ['routine', 'urgent', 'emergency', 'critical']).defaultTo('routine');
    table.integer('emergency_level').defaultTo(0); // 0-5 scale
    table.boolean('is_emergency').defaultTo(false);
    
    // Status Tracking
    table.enu('status', [
      'scheduled', 'confirmed', 'in_preparation', 'in_progress', 
      'completed', 'cancelled', 'postponed', 'emergency_override'
    ]).defaultTo('scheduled');
    
    // Pre-operative Requirements
    table.json('pre_op_requirements'); // Equipment, special preparations
    table.json('equipment_needed');
    table.boolean('requires_isolation').defaultTo(false);
    table.text('special_instructions');
    
    // Post-operative
    table.text('post_op_notes');
    table.text('complications');
    table.enu('outcome', ['successful', 'complications', 'cancelled', 'ongoing']).defaultTo('ongoing');
    
    // Administrative
    table.integer('created_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('updated_by').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.text('cancellation_reason');
    table.datetime('cancelled_at');
    
    // Alerts & Notifications
    table.boolean('alerts_sent').defaultTo(false);
    table.json('alert_history');
    
    table.timestamps(true, true);
    
    // Indexes for better performance
    table.index(['scheduled_date', 'status']);
    table.index(['ot_id', 'status']);
    table.index(['priority', 'is_emergency']);
    table.index(['primary_surgeon_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('ot_schedules');
};
