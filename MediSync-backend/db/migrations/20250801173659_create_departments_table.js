

exports.up = function(knex) {
  return knex.schema.createTable('departments', function(table) {
    table.increments('id').primary();
    table.string('name').notNullable().unique();
    table.text('description');
    table.integer('current_token').defaultTo(0);
    table.integer('last_token_number').defaultTo(0);
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('departments');
};
