

exports.up = function(knex) {
  return knex.schema.createTable('patients', function(table) {
    table.increments('id').primary();

    table.integer('user_id').unsigned()
      .references('id').inTable('users')
      .onDelete('SET NULL');

    table.string('name').notNullable();
    table.integer('age').notNullable();
    table.enum('gender', ['male', 'female', 'other']).notNullable();
    table.string('blood_group');
    table.string('phone_number').notNullable();
    table.text('address');
    table.text('medical_history');

    // current_medications: JSON column to store array of medication objects
    table.json('current_medications');

    // allergies: array of strings — also as JSON
    table.json('allergies');

    // emergency_contact: stored as JSON
    table.json('emergency_contact');

    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('patients');
};


