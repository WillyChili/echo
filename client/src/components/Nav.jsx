import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Nav() {
  const linkClass = ({ isActive }) =>
    cn(
      'px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-150 squircle select-none',
      isActive
        ? 'bg-secondary text-foreground'
        : 'text-muted-foreground active:text-foreground active:bg-secondary/50'
    );

  return (
    <nav className="sticky top-0 z-10 border-b border-border/60 bg-background/90 backdrop-blur-sm">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="text-foreground font-semibold tracking-wide select-none text-base">
          echo
        </span>
        <div className="flex items-center gap-1">
          <NavLink to="/" end className={linkClass}>Today</NavLink>
          <NavLink to="/chat" className={linkClass}>Echo</NavLink>
        </div>
      </div>
    </nav>
  );
}
