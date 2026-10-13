import { db } from '../lib/db'
import { academies, users, courses, templates } from '../lib/db/schema'
import { slugify } from '../lib/utils/helpers'

async function seed() {
  console.log('Seeding database...')

  const [academy] = await db
    .insert(academies)
    .values({
      name: 'Motion Academy',
      slug: 'motion',
      brandColor: '#6366f1',
      website: 'https://motionapp.com',
      senderName: 'Motion Academy',
      replyTo: 'academy@motionapp.com',
    })
    .onConflictDoNothing()
    .returning()

  console.log('Created academy:', academy.name)

  const [user] = await db
    .insert(users)
    .values({
      academyId: academy.id,
      email: 'admin@motionapp.com',
      name: 'Motion Admin',
      role: 'admin',
    })
    .onConflictDoNothing()
    .returning()

  console.log('Created user:', user.email)

  const [template] = await db
    .insert(templates)
    .values({
      academyId: academy.id,
      layout: 'letter',
      bodyText: `CERTIFICATE OF COMPLETION

This certifies that {{learner.name}} has successfully completed the

{{course.name}}

Awarded on {{issue_date}}
Certificate Number: {{certificate.number}}

This certificate demonstrates proficiency in creative strategy, content planning, and strategic thinking.`,
      emailSubject: 'Your {{course.name}} Certificate is Ready!',
      emailBody: `Hi {{learner.name}},

Congratulations on completing {{course.name}}!

Your certificate is ready to view, download, and share on LinkedIn.

Certificate Number: {{certificate.number}}
Issued: {{issue_date}}

Best regards,
Motion Academy Team`,
    })
    .onConflictDoNothing()
    .returning()

  const [course] = await db
    .insert(courses)
    .values({
      academyId: academy.id,
      name: 'Creative Strategy Bootcamp',
      code: 'CSB',
      description: 'A comprehensive bootcamp covering creative strategy, content planning, and strategic thinking for modern marketers.',
      validityMonths: 24,
      ctaLabel: 'Try Motion Free',
      ctaUrl: 'https://motionapp.com/signup',
      templateId: template.id,
    })
    .onConflictDoNothing()
    .returning()

  console.log('Created course:', course.name)

  console.log('\n✓ Seed data created successfully!')
  console.log('\nLogin credentials:')
  console.log('  Email: admin@motionapp.com')
  console.log('  Use the magic link flow to log in')
  console.log('\nTo log in:')
  console.log('  1. Go to http://localhost:3000/auth/login')
  console.log('  2. Enter: admin@motionapp.com')
  console.log('  3. Check the console for the magic link')

  process.exit(0)
}

seed().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
