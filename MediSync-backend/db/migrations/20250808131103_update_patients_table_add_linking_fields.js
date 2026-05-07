exports.up = function(knex) {
  return knex.schema.alterTable('patients', function(table) {
    // Add email field for linking patients to user accounts
    table.string('email').nullable();
    
    // Add fields to track staff creation and linking status
    table.boolean('created_by_staff').defaultTo(false);
    table.boolean('is_linked').defaultTo(false);
    
    // Add updated_at timestamp
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Add created_by field to track which staff member created the patient
    table.integer('created_by').unsigned().nullable().references('id').inTable('users').onDelete('SET NULL');
    
    // Add unique constraint on email (but allow nulls)
    table.unique(['email']);
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('patients', function(table) {
    table.dropColumn('email');
    table.dropColumn('created_by_staff');
    table.dropColumn('is_linked');
    table.dropColumn('updated_at');
    table.dropColumn('created_by');
    table.dropUnique(['email']);
  });
};
