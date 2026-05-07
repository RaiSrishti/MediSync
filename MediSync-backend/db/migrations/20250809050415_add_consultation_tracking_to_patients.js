/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('patients', function(table) {
    // Add consultation tracking fields
    table.text('diagnosis').nullable(); // Current diagnosis
    table.text('treatment_plan').nullable(); // Treatment plan
    table.text('notes').nullable(); // Doctor's notes
    table.timestamp('last_consultation_date').nullable(); // Last consultation date
    table.integer('last_consulted_by').unsigned().nullable().references('id').inTable('users'); // Last doctor who consulted
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('patients', function(table) {
    table.dropColumn('diagnosis');
    table.dropColumn('treatment_plan');
    table.dropColumn('notes');
    table.dropColumn('last_consultation_date');
    table.dropColumn('last_consulted_by');
  });
};
