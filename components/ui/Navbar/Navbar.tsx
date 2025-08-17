import { createClient } from '@/utils/supabase/server';
import s from './Navbar.module.css';
import Navlinks from './Navlinks';

export default async function Navbar() {
  let user = null;
  
  try {
    // Only try to get user if Supabase is properly configured
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } else {
      console.info('Navbar: Supabase environment variables not configured - running without authentication');
    }
  } catch (error) {
    // Gracefully handle auth errors - continue without user
    console.warn('Navbar: Authentication not available:', error instanceof Error ? error.message : 'Unknown error');
  }

  return (
    <nav className={s.root}>
      <a href="#skip" className="sr-only focus:not-sr-only">
        Skip to content
      </a>
      <div className="max-w-6xl px-6 mx-auto">
        <Navlinks user={user} />
      </div>
    </nav>
  );
}
