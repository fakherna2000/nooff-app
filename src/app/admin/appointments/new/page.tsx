import { redirect } from 'next/navigation';
export default function NewAppointmentRedirect() {
  redirect('/admin/appointments');
}
