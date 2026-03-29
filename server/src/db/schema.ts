import { boolean, integer, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';


export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').unique().notNull(),
  email: text('email').unique().notNull(),
  avatar_url: text('avatar_url'),
  bio: text('bio'),
  password: text('password').notNull(),
  is_verified: boolean('is_verified').default(false),
  last_seen: timestamp('last_seen'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().$onUpdate(() => new Date())
});

export const refreshTokensTable = pgTable('tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  user_id: uuid('user_id').notNull().references(() => usersTable.id, {onDelete: 'cascade'}),
  token_hash: text('token_hash').unique().notNull(),
  device_name: text('device_name'),
  device_os: text('device_os'),
  user_agent: text('user_agent'),
  ip_address: text('ip_address'),
  revoked: boolean('revoked').default(false),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().$onUpdate(() => new Date())
})