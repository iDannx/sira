import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Wallet, FileText,
  ChevronDown, LogOut, Megaphone,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types/api';

const ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  consulta: 'Solo consulta',
};

function initials(name: string | undefined | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : '';
  return (first + second).toUpperCase() || '?';
}

function AvatarCircle({ name, size = 'md' }: { name: string | undefined | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8 text-[10px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-12 h-12 text-sm',
  };
  return (
    <div
      className={clsx(
        'rounded-full bg-gradient-to-br from-[#00b4d8] to-[#00e5ff] text-navy-dark font-bold flex items-center justify-center shrink-0 border-2 border-[#00e5ff]/20',
        sizes[size],
      )}
    >
      {initials(name)}
    </div>
  );
}

export function Sidebar() {
  const { user } = useAuth();
  const links = [
    { name: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { name: 'Cartera', icon: Wallet, to: '/cartera' },
    { name: 'Acuerdos', icon: FileText, to: '/acuerdos' },
    { name: 'Campañas', icon: Megaphone, to: '/campanas' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 h-screen fixed left-0 top-0 flex flex-col z-20">
      <div className="p-6 mb-4">
        <img src="/Logo_SIRA_Light.png" alt="SIRA" className="h-24 w-auto object-contain" />
      </div>

      <nav className="flex-1 px-4 flex flex-col gap-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.to}
            className={({ isActive }) => clsx('sidebar-link', isActive && 'sidebar-link-active')}
          >
            <link.icon size={20} />
            <span className="text-sm font-medium">{link.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 mt-auto">
        <div className="flex items-center gap-3 px-2">
          <AvatarCircle name={user?.name} size="md" />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.name ?? 'Invitado'}</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">{user ? ROLE_LABEL[user.role] : '—'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', onClickOutside);
      return () => document.removeEventListener('mousedown', onClickOutside);
    }
  }, [menuOpen]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="h-20 fixed top-0 right-0 left-64 bg-white border-b border-slate-200 z-10 px-8 flex items-center justify-end">
      <div className="flex items-center gap-6">
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-2 py-1 transition-colors"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <AvatarCircle name={user?.name} size="sm" />
            <div className="text-right">
              <p className="text-xs font-bold leading-none">{user?.name ?? 'Invitado'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{user ? ROLE_LABEL[user.role] : '—'}</p>
            </div>
            <ChevronDown size={14} className={clsx('text-slate-400 transition-transform', menuOpen && 'rotate-180')} />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-30"
            >
              <div className="px-4 py-3 border-b border-slate-50">
                <p className="text-xs font-bold text-navy-dark truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => void handleLogout()}
                disabled={loggingOut}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                <LogOut size={16} /> {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
