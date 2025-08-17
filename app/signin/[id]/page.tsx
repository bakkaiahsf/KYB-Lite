import { redirect } from 'next/navigation';

export default function SignIn({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { disable_button: boolean };
}) {
  // Redirect to dashboard since we don't have authentication
  redirect('/dashboard');
}
