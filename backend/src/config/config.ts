import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  env: z.enum(['development', 'test', 'production']).default('development'),
  port: z.number().default(3000),
  jwt: z.object({
    secret: z.string(),
    expiresIn: z.string().default('1d')
  }),
  db: z.object({
    host: z.string(),
    port: z.number().default(5432),
    name: z.string(),
    user: z.string(),
    password: z.string()
  }),
  cors: z.object({
    origin: z.string()
  })
});

export const config = configSchema.parse({
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '3000', 10),
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN
  },
  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  }
});