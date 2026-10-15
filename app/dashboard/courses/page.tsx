import { redirect } from 'next/navigation'

export default function CoursesListRedirect() {
  redirect('/dashboard/programs')
}
