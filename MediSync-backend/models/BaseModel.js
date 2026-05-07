// models/BaseModel.js

const knex = require('knex');
const config = require('../knexfile');

class BaseModel {
  constructor(tableName) {
    this.db = knex(config.development);
    this.table = tableName;
  }

  async create(data) {
    const result = await this.db(this.table).insert(data);
    const id = result[0]; // MySQL returns inserted ID as first element
    return this.findById(id); 
  }

  async findById(id) {
    return this.db(this.table).where({ id }).first();
  }

  async findOne(filter) {
    return this.db(this.table).where(filter).first();
  }

  async findAll(filter = {}) {
    return this.db(this.table).where(filter);
  }

  async update(id, data) {
    await this.db(this.table).where({ id }).update(data);
    return this.findById(id);
  }

  async delete(id) {
    const deleted = await this.db(this.table).where({ id }).del();
    return deleted > 0;
  }
}

module.exports = BaseModel;
