/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('users', function(table) {
    // Add fields to track staff approval and status
    table.boolean('is_approved').defaultTo(false); // Whether admin has approved this staff member
    table.integer('approved_by').unsigned().nullable().references('id').inTable('users'); // Admin who approved
    table.timestamp('approved_at').nullable(); // When the approval was given
    table.enum('status', ['pending', 'approved', 'rejected', 'suspended']).defaultTo('pending'); // Account status
    table.text('rejection_reason').nullable(); // Reason for rejection if applicable
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('users', function(table) {
    table.dropColumn('is_approved');
    table.dropColumn('approved_by');
    table.dropColumn('approved_at');
    table.dropColumn('status');
    table.dropColumn('rejection_reason');
  });
};
