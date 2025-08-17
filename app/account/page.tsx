import { redirect } from 'next/navigation';

export default function Account() {
  // Redirect to dashboard since we don't have authentication
  redirect('/dashboard');
}
