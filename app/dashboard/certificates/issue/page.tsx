import { requireAuth } from '@/lib/utils/session'
import { db } from '@/lib/db'
import { courses, templates } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import IssueCertificateForm from './form'

export default async function IssueCertificatePage() {
  const user = await requireAuth()

  const allPrograms = await db
    .select()
    .from(courses)
    .where(eq(courses.academyId, user.academyId))
    .orderBy(desc(courses.createdAt))

  let defaultTemplate = await db
    .select()
    .from(templates)
    .where(eq(templates.academyId, user.academyId))
    .limit(1)

  if (defaultTemplate.length === 0) {
    const [newTemplate] = await db
      .insert(templates)
      .values({
        academyId: user.academyId,
        layout: 'letter',
        bodyText: 'This certificate is awarded to {{learner.name}} for successfully completing {{course.name}}.',
        emailSubject: 'Your {{course.name}} Certificate',
        emailBody: `Congratulations {{learner.name}}!

You have successfully completed {{course.name}}.

Your certificate is now available. Click the button below to view your certificate and add it to your LinkedIn profile.`,
      })
      .returning()
    
    defaultTemplate = [newTemplate]
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Issue Certificate</h1>
        <p className="mt-2 text-sm text-gray-700">
          Issue a certificate to one learner
        </p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <IssueCertificateForm 
            programs={allPrograms} 
            defaultTemplateId={defaultTemplate[0].id}
            academyId={user.academyId} 
            userId={user.id} 
          />
        </div>
      </div>
    </div>
  )
}
