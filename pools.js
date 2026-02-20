const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.WEATHER_USER,
  password: process.env.WEATHER_PW,
  host: '128.192.142.200',
  database: 'postgres',
  port: 5432,
});

module.exports = {
  pool,
};
