/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('tokens', function(table) {
    table.integer('doctor_id').unsigned().nullable()
      .references('id').inTable('users')
      .onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('tokens', function(table) {
    table.dropColumn('doctor_id');
  });
};
