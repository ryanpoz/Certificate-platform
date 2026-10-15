import { redirect } from 'next/navigation'

export default function IssueCertificatePage() {
  // Redirect to single certificate form for now
  redirect('/dashboard/courses/new/single')
}
