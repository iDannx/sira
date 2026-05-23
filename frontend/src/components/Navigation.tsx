import { LayoutDashboard, Wallet, Users, FileText, Settings, Rocket, Bell, Search, HelpCircle, ChevronDown, Wand2 } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { clsx } from 'clsx';

export function Sidebar() {
  const links = [
    { name: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
    { name: 'Cartera', icon: Wallet, to: '/cartera' },
    { name: 'Estudiantes', icon: Users, to: '/estudiantes' },
    { name: 'Acuerdos', icon: FileText, to: '/acuerdos' },
    { name: 'Gestiones', icon: Rocket, to: '/gestiones' },
    { name: 'Predicción de riesgo', icon: Rocket, to: '/predictive-risk' },
    { name: 'Automatizaciones', icon: Wand2, to: '/automations' },
    { name: 'Reportes', icon: FileText, to: '/reports' },
    { name: 'Configuración', icon: Settings, to: '/settings' },
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
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mb-3">Resumen del día</p>
          <div className="space-y-3">
            {[
              { label: 'Estudiantes contactados', val: '128' },
              { label: 'Acuerdos creados', val: '32' },
              { label: 'Recuperación de las', val: '$16.7M' },
            ].map((i) => (
              <div key={i.label} className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">{i.label}</span>
                <span className="text-slate-800 font-semibold">{i.val}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-6 flex items-center gap-3 px-2">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" className="w-10 h-10 rounded-full border-2 border-[#00e5ff]/20" referrerPolicy="no-referrer" />
          <div className="flex-1 overflow-hidden">
            <p className="text-xs font-semibold text-slate-800 truncate">Maria Fernanda</p>
            <p className="text-[10px] text-slate-400 font-medium truncate">Administradora</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function Header() {
  return (
    <header className="h-20 fixed top-0 right-0 left-64 bg-white border-b border-slate-200 z-10 px-8 flex items-center justify-between">
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input 
          type="text" 
          placeholder="Buscar estudiantes, acuerdos, gestiones..." 
          className="w-full bg-white rounded-full py-2.5 pl-12 pr-4 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/30 text-sm"
        />
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500 hover:text-navy-dark transition-colors cursor-pointer capitalize">
          <Bell size={20} />
          <div className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white -ml-4 -mt-3">
            1
          </div>
        </div>
        <HelpCircle className="text-slate-500 hover:text-navy-dark cursor-pointer" size={20} />
        <div className="flex items-center gap-3">
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
          <div className="text-right">
            <p className="text-xs font-bold leading-none">Maria Fernanda</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Administradora</p>
          </div>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>
    </header>
  );
}
