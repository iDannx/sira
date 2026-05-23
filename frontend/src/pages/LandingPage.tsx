import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, Wand2, Users, Shield, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center">
            <img src="/Logo_SIRA_Light.png" alt="SIRA" className="h-24 w-auto object-contain" />
          </div>

          <div className="hidden md:flex items-center gap-10">
            {['Inicio', 'Funcionalidades', 'Nosotros', 'Precios'].map((item) => (
              <a key={item} href="#" className="text-sm font-medium text-slate-500 hover:text-navy-dark transition-colors">{item}</a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-slate-700 px-6 py-2">Log In</Link>
            <Link to="/login" className="btn-primary shadow-xl">Agendar Demo</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div className="inline-flex items-center gap-2 bg-cyan-50 border border-cyan-100 px-4 py-2 rounded-full">
              <span className="flex h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-widest">Sistema Inteligente de Recuperación Activa</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-navy-dark leading-[1.1]">
              Optimiza la <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-indigo-600">permanencia estudiantil</span> con inteligencia artificial.
            </h1>
            <p className="text-lg text-slate-500 max-w-lg leading-relaxed font-medium">
              SIRA utiliza a AURA, nuestra IA generativa, para identificar riesgos y automatizar la recuperación financiera.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link to="/login" className="btn-primary px-10 py-4 text-base shadow-2xl">Agendar tu demo</Link>
              <button className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition-colors">
                Ver casos de éxito <ArrowRight size={18} />
              </button>
            </div>

            <div className="pt-10 flex items-center gap-8 border-t border-slate-100">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <img key={i} src={`https://i.pravatar.cc/100?u=${i}`} className="w-10 h-10 rounded-full border-2 border-white" />
                ))}
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Más de <span className="text-navy-dark">50 instituciones</span> confían en SIRA
              </p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-200 blur-[100px] opacity-20 -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-200 blur-[100px] opacity-20 -ml-20 -mb-20" />
            
            <div className="glass-card rounded-[40px] p-2 relative z-10 border-white/60">
              <img 
                src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200" 
                className="w-full h-auto rounded-[32px] shadow-sm"
                alt="Dashboard Preview"
              />
              {/* Floating Element */}
              <motion.div 
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-2xl border border-slate-100 w-64"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Recuperación</p>
                    <p className="text-xl font-bold text-navy-dark">+18.5%</p>
                  </div>
                </div>
                <div className="space-y-1.5 ring-1 ring-slate-100 p-3 rounded-xl bg-slate-50">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400">
                    <span>Proyectado</span>
                    <span>94%</span>
                  </div>
                  <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#00e5ff] w-[94%]" />
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Mascot */}
            <div className="absolute -top-20 -right-16 w-56 h-56 animate-float group z-20">
              <img src="/AURA_1.png" alt="AURA" className="w-full h-full object-contain drop-shadow-2xl" />
              <div className="absolute bottom-4 left-0 bg-white px-3 py-1.5 rounded-full shadow-lg border border-slate-100 scale-0 group-hover:scale-100 transition-transform origin-top-right whitespace-nowrap">
                <p className="text-[10px] font-bold text-navy-dark leading-none">¿Cómo puedo ayudarte?</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <p className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-12">Líderes globales de la industria académica confían en nosotros</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-40 grayscale">
            {['COOPER', 'Simplicity', 'SanBledder', 'CORNISA'].map((name) => (
              <span key={name} className="text-xl font-bold font-serif tracking-tighter text-navy-dark">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Stats */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
             <h2 className="text-sm font-bold text-cyan-600 uppercase tracking-widest leading-none">Resultados Comprobados</h2>
             <h3 className="text-4xl font-bold text-navy-dark tracking-tight">Maximiza el valor de por vida de tus estudiantes.</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { label: 'Recuperación mensual', value: '+18%' },
              { label: 'Precisión predictiva', value: '85%' },
              { label: 'Reducción de riesgo', value: '-30%' },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <p className="text-6xl font-bold text-navy-dark tracking-tighter">{stat.value}</p>
                <p className="text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-gradient-to-br from-indigo-900 to-navy-dark rounded-[40px] p-12 lg:p-20 text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/10 to-transparent blur-3xl" />
             <div className="relative z-10 space-y-8">
               <h2 className="text-3xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                 Conoce a AURA, tu asistente inteligente dentro de SIRA.
               </h2>
               <p className="text-indigo-200 text-lg max-w-2xl mx-auto font-medium">
                 Regístrate hoy mismo y descubre cómo SIRA puede ayudarte a mejorar tus indicadores clave de rendimiento.
               </p>
               <Link to="/login" className="btn-primary inline-block px-12 py-4 text-base shadow-2xl scale-110 hover:scale-115 transition-transform">
                 Comienza ahora gratis
               </Link>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function TrendingUp({ size, className }: { size: number, className?: string }) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><animate attributeName="stroke-dasharray" from="0, 50" to="50, 0" dur="2s" repeatCount="1" /></svg>;
}
