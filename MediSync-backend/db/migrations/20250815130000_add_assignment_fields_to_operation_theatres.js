exports.up = function(knex) {
  return knex.schema.table('operation_theatres', function(table) {
    table.date('assignment_date').nullable();
    table.time('assignment_time').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('operation_theatres', function(table) {
    table.dropColumn('assignment_date');
    table.dropColumn('assignment_time');
  });
};
