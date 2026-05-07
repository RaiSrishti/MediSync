

exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable();
    table.string('email').notNullable().unique();
    table.string('password').notNullable();
    table.enum('role', ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient']).defaultTo('patient');
    table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('SET NULL');
    table.string('refresh_token').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};
