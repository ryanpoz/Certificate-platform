import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required')
}

// Supabase transaction pooler requires prepare: false and ssl: require
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  ssl: 'require',
})

export const db = drizzle(client, { schema })
