
exports.up = function(knex) {
  return knex.schema.createTable('tokens', function(table) {
    table.increments('id').primary();

    table.integer('token_number').notNullable();

    // Foreign key to patients
    table.integer('patient_id').unsigned()
      .references('id').inTable('patients')
      .onDelete('CASCADE');

    // Foreign key to departments
    table.integer('department_id').unsigned()
      .references('id').inTable('departments')
      .onDelete('CASCADE');

    table.enum('status', ['waiting', 'in-progress', 'completed', 'no-show']).defaultTo('waiting');
    table.integer('priority').defaultTo(0);

    table.datetime('estimated_time');
    table.datetime('actual_service_time');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.date('date');

    table.unique(['department_id', 'token_number']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tokens');
};
