/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('departments', function(table) {
    // JSON fields to store arrays of user IDs for department-specific staff
    table.json('doctors').nullable(); // Array of doctor user IDs assigned to this department
    table.json('nurses').nullable(); // Array of nurse user IDs assigned to this department
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('departments', function(table) {
    table.dropColumn('doctors');
    table.dropColumn('nurses');
  });
};
