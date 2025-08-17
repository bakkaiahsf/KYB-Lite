'use client';

import Link from 'next/link';
import Logo from '@/components/icons/Logo';
import s from './Navbar.module.css';

interface NavlinksProps {
  user?: any;
}

export default function Navlinks({ user }: NavlinksProps) {
  return (
    <div className="relative flex flex-row justify-between py-4 align-center md:py-6">
      <div className="flex items-center flex-1">
        <Link href="/" className={s.logo} aria-label="KYB Lite - Company Analysis">
          <Logo />
        </Link>
        <nav className="ml-6 space-x-2 lg:block">
          <Link href="/" className={s.link}>
            Home
          </Link>
          <Link href="/dashboard" className={s.link}>
            Dashboard
          </Link>
          <Link href="/search" className={s.link}>
            Company Search
          </Link>
          <Link href="/api/docs" className={s.link}>
            API
          </Link>
        </nav>
      </div>
      <div className="flex justify-end space-x-8">
        <Link href="/about" className={s.link}>
          About
        </Link>
      </div>
    </div>
  );
}
