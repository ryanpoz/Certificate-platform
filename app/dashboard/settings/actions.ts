'use server'

import { db } from '@/lib/db'
import { academies } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { validateUrl } from '@/lib/utils/helpers'
import { accountFor, NOT_FOUND } from '@/lib/auth/ownership'

export async function updateAcademySettings(academyId: string, data: {
  name: string
  brandColor: string
  website: string
  senderName: string
  replyTo: string
}) {
  const account = await accountFor(academyId)
  if (!account) {
    return { error: NOT_FOUND }
  }

  if (!data.name || !data.senderName || !data.replyTo) {
    return { error: 'Name, sender name, and reply-to email are required' }
  }

  if (data.website && !validateUrl(data.website)) {
    return { error: 'Please enter a valid website URL' }
  }

  await db
    .update(academies)
    .set({
      name: data.name,
      brandColor: data.brandColor,
      website: data.website,
      senderName: data.senderName,
      replyTo: data.replyTo,
    })
    .where(eq(academies.id, account.academyId))

  revalidatePath('/dashboard/settings')
  return { success: true }
}
