exports.up = function(knex) {
  return knex.schema.createTable('system_settings', function(table) {
    table.increments('id').primary();
    table.string('setting_key').notNullable().unique();
    table.text('setting_value');
    table.text('description');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).then(() => {
    // Insert default time restrictions
    return knex('system_settings').insert([
      {
        setting_key: 'token_generation_start_time',
        setting_value: '07:00',
        description: 'Start time for token generation (24-hour format)',
        is_active: true
      },
      {
        setting_key: 'token_generation_end_time',
        setting_value: '20:00',
        description: 'End time for token generation (24-hour format)',
        is_active: true
      },
      {
        setting_key: 'auto_delete_tokens_time',
        setting_value: '00:00',
        description: 'Time to automatically delete all tokens (24-hour format)',
        is_active: true
      },
      {
        setting_key: 'token_time_restriction_enabled',
        setting_value: 'true',
        description: 'Enable/disable token generation time restrictions',
        is_active: true
      }
    ]);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('system_settings');
};
