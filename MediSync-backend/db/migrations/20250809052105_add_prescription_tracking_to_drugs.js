/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('drugs', function(table) {
    // Add basic inventory tracking fields
    table.integer('dispensed_today').defaultTo(0); // Drugs dispensed today
    table.integer('added_by').unsigned().nullable().references('id').inTable('users'); // Pharmacist who added
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Drug information fields
    table.text('usage_instructions').nullable();
    table.text('side_effects').nullable();
    table.text('contraindications').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('drugs', function(table) {
    table.dropColumn('dispensed_today');
    table.dropColumn('added_by');
    table.dropColumn('created_at');
    table.dropColumn('updated_at');
    table.dropColumn('usage_instructions');
    table.dropColumn('side_effects');
    table.dropColumn('contraindications');
  });
};
