import { boolean, json, pgEnum, pgTable, primaryKey, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const statusEnum = pgEnum('status', [
  'pending',
  'accepted',
  'rejected'
]);

export const chatTypeEnum = pgEnum('chat_type', ['direct', 'group']);

export const chatRoleEnum = pgEnum("chat_role", [
  "admin",
  "member",
]);

export const messageTypeEnum = pgEnum("message_type", [
  "text",
  "image",
  "video",
  "file",
]);

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
});

export const friendShipTable = pgTable('friendships', {
  id: uuid('id').defaultRandom().primaryKey(),
  requester_id: uuid('requester_id').notNull().references(()=> usersTable.id, {onDelete: 'cascade'}),
  addressee_id: uuid('addressee_id').notNull().references(()=> usersTable.id, {onDelete: 'cascade'}),
  status: statusEnum('status').default('pending'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().$onUpdate(() => new Date())
});

export const chatsTable = pgTable('chats', {
  id: uuid('id').defaultRandom().primaryKey(),
  type: chatTypeEnum('type').default('direct').notNull(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  createdBy: uuid('created_by').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const chatMembersTable = pgTable("chat_members",{
    chatId: uuid("chat_id").notNull().references(() => chatsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: chatRoleEnum("role").default("member").notNull(),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table)=> [primaryKey({columns: [table.chatId, table.userId]})]
)

export const messagesTable = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  chatId: uuid('chat_id').notNull().references(() => chatsTable.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  type: messageTypeEnum('type').default('text').notNull(),
  content: text('content'),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  editedAt: timestamp('edited_at'),
  deletedAt: timestamp('deleted_at')
});

export const messageReadsTable = pgTable('message_reads', {
  messageId: uuid('message_id').notNull().references(() => messagesTable.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
  seenAt: timestamp('seen_at').defaultNow().notNull(),
  }, 
  (table)=> [primaryKey({columns: [table.messageId, table.userId]})]
);
