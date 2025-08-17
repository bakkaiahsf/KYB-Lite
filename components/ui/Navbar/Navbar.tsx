import s from './Navbar.module.css';
import Navlinks from './Navlinks';

export default function Navbar() {
  // No authentication - public access to all features
  const user = null;

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
