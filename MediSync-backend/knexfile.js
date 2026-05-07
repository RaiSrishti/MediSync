require('dotenv').config();
const fs = require('fs');
const path = require('path');

module.exports={
    development:{
        client:'mysql2',
        connection: process.env.DATABASE_URL,
        migrations:{
            tableName:'knex_migrations',
            directory:'./db/migrations',
        },
    },
};