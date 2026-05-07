exports.up = async function(knex) {
  // 1. Create new table with correct unique constraint
  await knex.schema.createTable('tokens_new', function(table) {
    table.increments('id').primary();
    table.integer('token_number').notNullable();
    table.integer('patient_id').unsigned().references('id').inTable('patients').onDelete('CASCADE');
    table.integer('department_id').unsigned().references('id').inTable('departments').onDelete('CASCADE');
    table.integer('doctor_id').unsigned().nullable();
    table.enum('status', ['waiting', 'in-progress', 'completed', 'no-show']).defaultTo('waiting');
    table.integer('priority').defaultTo(0);
    table.datetime('estimated_time');
    table.datetime('actual_service_time');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.date('date');
    table.unique(['department_id', 'token_number', 'date']);
  });

  // 2. Copy data from old table to new table
  await knex.raw(`INSERT INTO tokens_new (id, token_number, patient_id, department_id, doctor_id, status, priority, estimated_time, actual_service_time, created_at, date)
    SELECT id, token_number, patient_id, department_id, doctor_id, status, priority, estimated_time, actual_service_time, created_at, date FROM tokens`);

  // 3. Drop old table
  await knex.schema.dropTable('tokens');

  // 4. Rename new table to original name
  await knex.schema.renameTable('tokens_new', 'tokens');
};

exports.down = async function(knex) {
  // This down migration is destructive and not recommended for production
  // (Would require recreating the old unique constraint and possibly losing data)
};
