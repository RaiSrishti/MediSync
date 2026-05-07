// migrations/20250801_create_operation_theatres_table.js
exports.up = function(knex) {
  return knex.schema.createTable('operation_theatres', function(table) {
    table.increments('id').primary();

    table.string('ot_number').notNullable().unique();
    
    table.enu('status', [
      'available', 'scheduled', 'in-use', 'cleaning', 'maintenance',
      'emergency', 'completed', 'cancelled'
    ]).defaultTo('available');

    table.string('current_procedure');
    table.string('surgery_type');
    table.string('patient_name');

    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('SET NULL');
    table.integer('doctor_id').unsigned().references('id').inTable('users').onDelete('SET NULL');
    table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');

    table.string('theatre');

    table.timestamp('scheduled_start_time');
    table.timestamp('scheduled_end_time');
    table.timestamp('scheduled_date_time');
    table.timestamp('actual_start_time');
    table.timestamp('actual_end_time');

    table.integer('duration').defaultTo(60); // in minutes
    table.integer('emergency_level').defaultTo(0); // 0: normal

    table.text('notes');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('operation_theatres');
};
