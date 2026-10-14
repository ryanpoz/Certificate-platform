import { pgTable, text, timestamp, uuid, integer, jsonb, boolean, unique } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const academies = pgTable('academies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'),
  brandColor: text('brand_color').default('#2563eb'),
  website: text('website'),
  senderName: text('sender_name').notNull(),
  replyTo: text('reply_to').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('admin'),
  magicLinkToken: text('magic_link_token'),
  magicLinkExpiry: timestamp('magic_link_expiry'),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueEmail: unique().on(table.academyId, table.email),
}))

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  validityMonths: integer('validity_months'),
  ctaLabel: text('cta_label'),
  ctaUrl: text('cta_url'),
  templateId: uuid('template_id'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueCode: unique().on(table.academyId, table.code),
}))

export const templates = pgTable('templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  layout: text('layout').notNull().default('letter'),
  backgroundUrl: text('background_url'),
  signatureUrl: text('signature_url'),
  bodyText: text('body_text').notNull(),
  emailSubject: text('email_subject').notNull(),
  emailBody: text('email_body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const customFields = pgTable('custom_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  key: text('key').notNull(),
  label: text('label').notNull(),
  type: text('type').notNull().default('text'),
  showOnCertificate: boolean('show_on_certificate').default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueKey: unique().on(table.academyId, table.key),
}))

export const learners = pgTable('learners', {
  id: uuid('id').primaryKey().defaultRandom(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  fullName: text('full_name').notNull(),
  email: text('email').notNull(),
  emailNormalised: text('email_normalised').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueEmail: unique().on(table.academyId, table.emailNormalised),
}))

export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: text('number').notNull().unique(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  learnerId: uuid('learner_id').notNull().references(() => learners.id),
  issueDate: timestamp('issue_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  status: text('status').notNull().default('unpublished'),
  custom: jsonb('custom').default({}),
  batchId: uuid('batch_id'),
  source: text('source').notNull().default('upload'),
  priorCertificateId: uuid('prior_certificate_id'),
  revokedAt: timestamp('revoked_at'),
  revokeReason: text('revoke_reason'),
  publishedAt: timestamp('published_at'),
  isPreview: boolean('is_preview').default(false),
  pendingChanges: jsonb('pending_changes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const batches = pgTable('batches', {
  id: uuid('id').primaryKey().defaultRandom(),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  courseId: uuid('course_id').notNull().references(() => courses.id),
  fileName: text('file_name').notNull(),
  columnMap: jsonb('column_map').notNull(),
  rowsTotal: integer('rows_total').notNull(),
  created: integer('created').notNull().default(0),
  skipped: integer('skipped').notNull().default(0),
  errors: integer('errors').notNull().default(0),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const events = pgTable('events', {
  id: uuid('id').primaryKey().defaultRandom(),
  certificateId: uuid('certificate_id').references(() => certificates.id),
  academyId: uuid('academy_id').notNull().references(() => academies.id),
  type: text('type').notNull(),
  at: timestamp('at').notNull().defaultNow(),
  referrer: text('referrer'),
  utmData: jsonb('utm_data'),
  userAgent: text('user_agent'),
  isBot: boolean('is_bot').default(false),
  visitorHash: text('visitor_hash'),
  meta: jsonb('meta'),
})

export const academiesRelations = relations(academies, ({ many }) => ({
  users: many(users),
  courses: many(courses),
  templates: many(templates),
  customFields: many(customFields),
  learners: many(learners),
  certificates: many(certificates),
}))

export const usersRelations = relations(users, ({ one }) => ({
  academy: one(academies, {
    fields: [users.academyId],
    references: [academies.id],
  }),
}))

export const coursesRelations = relations(courses, ({ one, many }) => ({
  academy: one(academies, {
    fields: [courses.academyId],
    references: [academies.id],
  }),
  template: one(templates, {
    fields: [courses.templateId],
    references: [templates.id],
  }),
  certificates: many(certificates),
}))

export const certificatesRelations = relations(certificates, ({ one }) => ({
  academy: one(academies, {
    fields: [certificates.academyId],
    references: [academies.id],
  }),
  course: one(courses, {
    fields: [certificates.courseId],
    references: [courses.id],
  }),
  learner: one(learners, {
    fields: [certificates.learnerId],
    references: [learners.id],
  }),
  batch: one(batches, {
    fields: [certificates.batchId],
    references: [batches.id],
  }),
}))

export const batchesRelations = relations(batches, ({ one, many }) => ({
  academy: one(academies, {
    fields: [batches.academyId],
    references: [academies.id],
  }),
  course: one(courses, {
    fields: [batches.courseId],
    references: [courses.id],
  }),
  createdByUser: one(users, {
    fields: [batches.createdBy],
    references: [users.id],
  }),
  certificates: many(certificates),
}))
