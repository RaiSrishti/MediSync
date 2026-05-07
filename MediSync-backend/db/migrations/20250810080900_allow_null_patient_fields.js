exports.up = function(knex) {
  return knex.schema.alterTable('patients', function(table) {
    // Allow NULL values for optional patient fields during self-registration
    table.integer('age').nullable().alter();
    table.enum('gender', ['male', 'female', 'other']).nullable().alter();
    table.string('phone_number').nullable().alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('patients', function(table) {
    // Revert to NOT NULL constraints
    table.integer('age').notNullable().alter();
    table.enum('gender', ['male', 'female', 'other']).notNullable().alter();
    table.string('phone_number').notNullable().alter();
  });
};
