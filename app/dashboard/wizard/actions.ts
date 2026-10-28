'use server'

import { db } from '@/lib/db'
import { academies, courses, certificates, learners, templates } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { sendCertificateEmail } from '@/lib/email/resend'

interface CreateCertificateWizardData {
  academyId: string
  userId: string
  certificateName: string
  templateConfig: any
  recipients: Array<{ name: string; email: string }>
  description?: string
  programName?: string
}

interface SaveDraftData {
  academyId: string
  userId: string
  draftId?: string
  certificateName: string
  templateConfig: any
  currentStep: number
  recipients: Array<{ name: string; email: string }>
  description?: string
  programName?: string
  selectedTemplateId?: string
}

export async function saveDraft(data: SaveDraftData) {
  try {
    const { academyId, userId, draftId, certificateName, templateConfig, currentStep, recipients, description, programName, selectedTemplateId } = data

    const draftData = {
      certificateName,
      templateConfig,
      currentStep,
      recipients,
      description,
      programName,
      selectedTemplateId,
      lastSaved: new Date().toISOString(),
    }

    let id = draftId
    if (draftId) {
      // Update existing draft
      await db
        .update(courses)
        .set({ draftData, name: certificateName || 'Untitled Certificate' })
        .where(eq(courses.id, draftId))
    } else {
      // Create new draft
      const courseCode = `DRAFT-${nanoid(6).toUpperCase()}`
      const [course] = await db
        .insert(courses)
        .values({
          academyId,
          name: certificateName || 'Untitled Certificate',
          code: courseCode,
          description: description || '',
          draftData,
        })
        .returning()

      id = course.id
    }

    revalidatePath('/dashboard/certificates')
    revalidatePath('/dashboard/wizard')
    return { success: true, draftId: id }
  } catch (error) {
    console.error('Failed to save draft:', error)
    return { error: 'Failed to save draft' }
  }
}

export async function loadDraft(draftId: string) {
  try {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, draftId))
      .limit(1)

    if (!course || !course.draftData) {
      return { error: 'Draft not found' }
    }

    return { success: true, draft: course.draftData, courseName: course.name }
  } catch (error) {
    console.error('Failed to load draft:', error)
    return { error: 'Failed to load draft' }
  }
}

/** Load a course for editing — draft data if present, otherwise published template design. */
export async function loadCourseForEdit(courseId: string) {
  try {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, courseId))
      .limit(1)

    if (!course) {
      return { error: 'Certificate not found' }
    }

    if (course.draftData) {
      return {
        success: true,
        mode: 'draft' as const,
        courseId: course.id,
        courseName: course.name,
        draft: course.draftData as any,
      }
    }

    let templateConfig: any = null
    let templateId: string | null = course.templateId || null
    if (course.templateId) {
      const [template] = await db
        .select()
        .from(templates)
        .where(eq(templates.id, course.templateId))
        .limit(1)
      templateConfig = template?.designConfig || null
      templateId = template?.id || null
    }

    return {
      success: true,
      mode: 'published' as const,
      courseId: course.id,
      courseName: course.name,
      description: course.description || '',
      templateId,
      templateConfig,
    }
  } catch (error) {
    console.error('Failed to load course for edit:', error)
    return { error: 'Failed to load certificate' }
  }
}

/** Persist design edits for an already-published certificate (updates linked template). */
export async function savePublishedDesign(data: {
  courseId: string
  academyId: string
  certificateName: string
  templateConfig: any
  description?: string
  templateId?: string | null
}) {
  try {
    const { courseId, academyId, certificateName, templateConfig, description, templateId } = data

    let resolvedTemplateId = templateId || null

    if (resolvedTemplateId) {
      await db
        .update(templates)
        .set({
          name: certificateName,
          designConfig: templateConfig,
          updatedAt: new Date(),
        })
        .where(eq(templates.id, resolvedTemplateId))
    } else {
      const [created] = await db
        .insert(templates)
        .values({
          academyId,
          name: certificateName,
          isDefault: false,
          designConfig: templateConfig,
          bodyText: `This certifies that {{learnerName}} has successfully completed {{courseName}}.`,
          emailSubject: `Your ${certificateName} Certificate`,
          emailBody: `Congratulations! You've earned your ${certificateName} certificate.`,
          version: 1,
        })
        .returning()
      resolvedTemplateId = created.id
    }

    await db
      .update(courses)
      .set({
        name: certificateName,
        description: description || '',
        templateId: resolvedTemplateId,
      })
      .where(eq(courses.id, courseId))

    revalidatePath('/dashboard/certificates')
    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: true, templateId: resolvedTemplateId }
  } catch (error) {
    console.error('Failed to save published design:', error)
    return { error: 'Failed to save design' }
  }
}

export async function deleteDraft(draftId: string, academyId?: string) {
  try {
    const [course] = await db
      .select()
      .from(courses)
      .where(eq(courses.id, draftId))
      .limit(1)

    if (!course) {
      return { error: 'Draft not found' }
    }
    if (academyId && course.academyId !== academyId) {
      return { error: 'Draft not found' }
    }

    const isDraft =
      course.draftData != null ||
      (course.code.startsWith('DRAFT-') && !course.templateId)

    if (!isDraft) {
      return { error: 'Only drafts can be deleted from this action' }
    }

    await db.delete(courses).where(eq(courses.id, draftId))
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/certificates')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete draft:', error)
    return { error: 'Failed to delete draft' }
  }
}

export async function createCertificateFromWizard(data: CreateCertificateWizardData & { draftId?: string }) {
  try {
    const { academyId, userId, certificateName, templateConfig, recipients, description, programName, draftId } = data

    // Get academy details for email
    const [academy] = await db
      .select()
      .from(academies)
      .where(eq(academies.id, academyId))
      .limit(1)

    if (!academy) {
      return { error: 'Academy not found' }
    }

    // Create or find a template for this certificate
    const bodyText = `This certifies that {{learnerName}} has successfully completed {{courseName}}.

Issued on {{issueDate}}
Certificate #{{certificateNumber}}`

    const [template] = await db
      .insert(templates)
      .values({
        academyId,
        name: certificateName,
        isDefault: false,
        designConfig: templateConfig,
        bodyText,
        emailSubject: `Your ${certificateName} Certificate`,
        emailBody: `Congratulations! You've earned your ${certificateName} certificate.`,
        version: 1,
      })
      .returning()

    // Auto-create a program (course) for this certificate
    // Or update existing draft course
    let course
    if (draftId) {
      // Update draft to published state (drop draft payload + DRAFT- code)
      const [updated] = await db
        .update(courses)
        .set({
          name: programName || certificateName,
          code: `CERT-${nanoid(6).toUpperCase()}`,
          description: description || `Certificate program for ${certificateName}`,
          templateId: template.id,
          draftData: null, // Clear draft data on publish
        })
        .where(eq(courses.id, draftId))
        .returning()
      course = updated
    } else {
      const courseCode = `CERT-${nanoid(6).toUpperCase()}`
      const [created] = await db
        .insert(courses)
        .values({
          academyId,
          name: programName || certificateName,
          code: courseCode,
          description: description || `Certificate program for ${certificateName}`,
          templateId: template.id,
        })
        .returning()
      course = created
    }

    // Process recipients
    const issuedCertificates = []
    const emailErrors = []

    for (const recipient of recipients) {
      try {
        // Create or find learner
        const emailNormalised = recipient.email.toLowerCase().trim()
        let learner

        const [existingLearner] = await db
          .select()
          .from(learners)
          .where(and(eq(learners.academyId, academyId), eq(learners.emailNormalised, emailNormalised)))
          .limit(1)

        if (existingLearner) {
          learner = existingLearner
        } else {
          const [newLearner] = await db
            .insert(learners)
            .values({
              academyId,
              fullName: recipient.name,
              email: recipient.email,
              emailNormalised,
            })
            .returning()
          learner = newLearner
        }

        // Create certificate
        const certificateNumber = `${course.code}-${nanoid(8).toUpperCase()}`
        const issueDate = new Date()

        const [certificate] = await db
          .insert(certificates)
          .values({
            academyId,
            courseId: course.id,
            learnerId: learner.id,
            number: certificateNumber,
            issueDate,
            status: 'valid',
            source: 'wizard',
            publishedAt: issueDate,
          })
          .returning()

        issuedCertificates.push({
          id: certificate.id,
          number: certificateNumber,
          learnerName: learner.fullName,
          learnerEmail: learner.email,
        })

        // Try to send email - but don't fail if it doesn't work
        // Resend only works for verified domains currently
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          await sendCertificateEmail({
            to: learner.email,
            learnerName: learner.fullName,
            courseName: course.name,
            certificateNumber,
            issueDate,
            expiryDate: null,
            certificateUrl: `${appUrl}/c/${certificateNumber}`,
            academyName: academy.name,
            academySenderName: academy.senderName,
            academyReplyTo: academy.replyTo,
            emailSubject: template.emailSubject,
            emailBody: template.emailBody,
          })
        } catch (emailError) {
          console.error(`Email delivery failed for ${learner.email}:`, emailError)
          emailErrors.push({
            email: learner.email,
            error: emailError instanceof Error ? emailError.message : 'Unknown error',
          })
        }
      } catch (recipientError) {
        console.error(`Failed to process recipient ${recipient.email}:`, recipientError)
        return { error: `Failed to process ${recipient.email}` }
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/certificates')

    return {
      success: true,
      certificateId: course.id, // Return the course/program ID as the certificate group ID
      courseName: course.name,
      issuedCertificates,
      emailErrors: emailErrors.length > 0 ? emailErrors : null,
    }
  } catch (error) {
    console.error('Failed to create certificate from wizard:', error)
    return { error: 'Failed to create certificate. Please try again.' }
  }
}

export async function parseCsvRecipients(csvText: string): Promise<Array<{ name: string; email: string }>> {
  const lines = csvText.trim().split('\n')
  if (lines.length === 0) {
    return []
  }

  // Skip header row if it exists
  const dataLines = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('email')
    ? lines.slice(1)
    : lines

  const recipients: Array<{ name: string; email: string }> = []
  const seen = new Set<string>()

  for (const line of dataLines) {
    const [name, email] = line.split(',').map(s => s.trim())
    if (name && email && email.includes('@')) {
      const normalizedEmail = email.toLowerCase()
      if (!seen.has(normalizedEmail)) {
        seen.add(normalizedEmail)
        recipients.push({ name, email })
      }
    }
  }

  return recipients
}

export async function checkFirstTimeUser(academyId: string): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(certificates)
    .where(eq(certificates.academyId, academyId))

  return (result?.count || 0) === 0
}

export async function createSampleCertificate(academyId: string, userId: string) {
  try {
    const [academy] = await db
      .select()
      .from(academies)
      .where(eq(academies.id, academyId))
      .limit(1)

    if (!academy) {
      return { error: 'Academy not found' }
    }

    // Use the Modern template
    const modernTemplate = {
      colors: {
        primary: '#2563eb',
        secondary: '#64748b',
        accent: '#0ea5e9',
        background: '#ffffff',
        text: '#1e293b',
      },
      fonts: {
        heading: 'Playfair Display',
        body: 'Inter',
      },
      layout: {
        orientation: 'portrait' as const,
        padding: 'normal' as const,
        alignment: 'center' as const,
      },
      border: {
        enabled: true,
        style: 'solid' as const,
        width: 4,
        color: '#2563eb',
      },
      background: {
        type: 'color' as const,
        value: '#ffffff',
      },
    }

    const bodyText = `This certifies that {{learnerName}} has successfully completed {{courseName}}.

Issued on {{issueDate}}
Certificate #{{certificateNumber}}`

    const [template] = await db
      .insert(templates)
      .values({
        academyId,
        name: `${academy.name} Certificate (Sample)`,
        isDefault: false,
        designConfig: modernTemplate,
        bodyText,
        emailSubject: `Your certificate from ${academy.name}`,
        emailBody: `Congratulations! You've earned your certificate.`,
        version: 1,
      })
      .returning()

    const [course] = await db
      .insert(courses)
      .values({
        academyId,
        name: 'Sample Certificate',
        code: `SAMPLE-${nanoid(6).toUpperCase()}`,
        description: 'This is a sample certificate to show you how it works. Feel free to delete it!',
        templateId: template.id,
      })
      .returning()

    const [learner] = await db
      .insert(learners)
      .values({
        academyId,
        fullName: 'Sample Learner',
        email: 'sample@example.com',
        emailNormalised: 'sample@example.com',
      })
      .returning()

    const certificateNumber = `${course.code}-${nanoid(8).toUpperCase()}`
    
    await db.insert(certificates).values({
      academyId,
      courseId: course.id,
      learnerId: learner.id,
      number: certificateNumber,
      issueDate: new Date(),
      status: 'valid',
      source: 'system',
      publishedAt: new Date(),
    })

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/certificates')

    return { success: true }
  } catch (error) {
    console.error('Failed to create sample certificate:', error)
    return { error: 'Failed to create sample certificate' }
  }
}
