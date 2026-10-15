import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { getEnvVar } from '../utils/env'

const DATABASE_URL = getEnvVar('DATABASE_URL', 'postgresql://localhost:5432/dev')

// Supabase transaction pooler requires prepare: false and ssl: require
const client = postgres(DATABASE_URL, {
  prepare: false,
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
})

export const db = drizzle(client, { schema })
