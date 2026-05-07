
exports.up = function(knex) {
  return knex.schema.createTable('drugs', function(table) {
    table.increments('id').primary();
    
    table.string('name').notNullable();
    table.string('generic_name');
    table.string('category').notNullable();
    table.text('description');
    table.string('manufacturer');
    
    table.integer('current_stock').notNullable().defaultTo(0);
    table.integer('minimum_stock').defaultTo(10);
    
    table.string('unit').notNullable();
    table.decimal('unit_price', 10, 2).notNullable();
    
    table.date('expiry_date');
    table.string('location');
    
    table.boolean('is_available').defaultTo(true);
    
    table.timestamp('last_updated').defaultTo(knex.fn.now());

    // Optional: Indexes for text search
    table.index(['name', 'generic_name'], 'drug_search_index');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('drugs');
};
