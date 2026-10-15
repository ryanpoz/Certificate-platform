import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { certificates, courses, learners, academies, templates, events } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { generateCertificatePDF } from '@/lib/pdf/generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const { number } = await params

    const [result] = await db
      .select({
        certificate: certificates,
        course: courses,
        learner: learners,
        academy: academies,
        template: templates,
      })
      .from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id))
      .innerJoin(learners, eq(certificates.learnerId, learners.id))
      .innerJoin(academies, eq(certificates.academyId, academies.id))
      .leftJoin(templates, eq(courses.templateId, templates.id))
      .where(eq(certificates.number, number))
      .limit(1)

    if (!result) {
      return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
    }

    const { certificate, course, learner, academy, template } = result

    if (!certificate.isPreview) {
      await db.insert(events).values({
        certificateId: certificate.id,
        academyId: academy.id,
        type: 'pdf_download',
        at: new Date(),
      })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const certificateUrl = `${appUrl}/c/${certificate.number}`

    const pdfBuffer = await generateCertificatePDF({
      certificateNumber: certificate.number,
      learnerName: learner.fullName,
      courseName: course.name,
      issueDate: certificate.issueDate,
      expiryDate: certificate.expiryDate,
      academyName: academy.name,
      brandColor: academy.brandColor || '#2563eb',
      bodyText: template?.bodyText || '',
      custom: certificate.custom as Record<string, any>,
      certificateUrl,
      designConfig: template?.designConfig as any,
    })

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${certificate.number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
