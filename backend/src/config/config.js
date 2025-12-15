require('dotenv').config();

module.exports = {
  development: {
    username: process.env.POSTGRES_USER || 'dev_user',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    database: process.env.POSTGRES_DB || 'dpdc_ami_dev',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    logging: true
  },
  test: {
    username: process.env.POSTGRES_USER || 'dev_user',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    database: process.env.POSTGRES_DB || 'dpdc_ami_test',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    logging: false
  },
  production: {
    username: process.env.POSTGRES_USER || 'dev_user',
    password: process.env.POSTGRES_PASSWORD || 'admin',
    database: process.env.POSTGRES_DB || 'dpdc_ami_dev',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT) || 5432,
    dialect: 'postgres',
    logging: false
  }
};
