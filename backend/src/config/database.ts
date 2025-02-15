import { Pool } from 'pg';
import { config } from './config';

export const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  database: config.db.name,
  password: config.db.password,
  port: config.db.port,
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : false
});