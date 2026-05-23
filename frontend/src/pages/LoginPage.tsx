import { FormEvent } from 'react';
import { Mail, Lock, Eye, LogIn, TrendingDown, TrendingUp, FileText, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="flex w-full max-w-[980px] rounded-[2rem] overflow-hidden shadow-2xl">

      {/* ── Panel izquierdo ── */}
      <div
        className="hidden lg:flex lg:w-[500px] shrink-0 relative overflow-hidden flex-col p-10"
        style={{ background: 'linear-gradient(150deg, #020d1f 0%, #071428 50%, #0b1e3a 100%)' }}
      >
        {/* Glow de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Silueta de ciudad */}
        <div className="absolute bottom-0 left-0 right-0 h-44 opacity-15 pointer-events-none">
          <svg viewBox="0 0 900 180" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" fill="#00e5ff">
            <rect x="0"   y="110" width="28"  height="70" />
            <rect x="33"  y="90"  width="18"  height="90" />
            <rect x="56"  y="65"  width="38"  height="115" />
            <rect x="100" y="100" width="22"  height="80" />
            <rect x="128" y="50"  width="48"  height="130" />
            <rect x="136" y="32"  width="9"   height="18" />
            <rect x="182" y="82"  width="32"  height="98" />
            <rect x="220" y="60"  width="42"  height="120" />
            <rect x="268" y="92"  width="18"  height="88" />
            <rect x="292" y="38"  width="58"  height="142" />
            <rect x="302" y="20"  width="8"   height="18" />
            <rect x="356" y="72"  width="28"  height="108" />
            <rect x="390" y="52"  width="48"  height="128" />
            <rect x="444" y="85"  width="22"  height="95" />
            <rect x="472" y="30"  width="68"  height="150" />
            <rect x="482" y="12"  width="10"  height="18" />
            <rect x="546" y="62"  width="38"  height="118" />
            <rect x="590" y="95"  width="28"  height="85" />
            <rect x="624" y="45"  width="52"  height="135" />
            <rect x="682" y="78"  width="22"  height="102" />
            <rect x="710" y="58"  width="62"  height="122" />
            <rect x="720" y="38"  width="8"   height="20" />
            <rect x="778" y="88"  width="30"  height="92" />
            <rect x="814" y="68"  width="44"  height="112" />
            <rect x="864" y="100" width="36"  height="80" />
          </svg>
        </div>

        {/* Contenido */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Mascota */}
          <img src="/AURA_1.png" alt="AURA" className="w-36 h-36 object-contain drop-shadow-2xl animate-float mb-6" />

          {/* Badge */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 w-fit px-4 py-2 rounded-full mb-6">
            <TrendingUp size={12} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-white uppercase tracking-widest">Insight Reciente</span>
            <span className="w-px h-3 bg-white/20" />
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">+18% Recuperación</span>
          </div>

          {/* Título */}
          <h2 className="text-3xl font-bold text-white leading-snug mb-4">
            Reduce la deserción estudiantil y mejora la{' '}
            <span className="text-cyan-400">recuperación financiera.</span>
          </h2>

          <p className="text-slate-400 text-xs font-medium mb-8 leading-relaxed">
            IA predictiva • Automatización inteligente •<br />
            Comunicación efectiva • Decisiones basadas en datos
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[
              { icon: TrendingDown, label: 'Riesgo de Deserción',     value: '↓ 32%', sub: 'Reducción estimada este semestre' },
              { icon: TrendingUp,   label: 'Recuperación Financiera', value: '+18%',  sub: 'Aumento en recuperación este mes' },
              { icon: FileText,     label: 'Acuerdos Generados',      value: '1.248', sub: 'Acuerdos activos en ejecución' },
            ].map(({ icon: Icon, label, value, sub }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon size={13} className="text-cyan-400 shrink-0" />
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide leading-tight">{label}</p>
                </div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-[9px] text-slate-500 mt-1 leading-tight">{sub}</p>
              </div>
            ))}
          </div>

          {/* IA activa */}
          <div className="mt-auto flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <Brain size={20} className="text-cyan-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed flex-1">
              IA activa 24/7 analizando, prediciendo y ayudando a más estudiantes a permanecer en su camino.
            </p>
            <div className="flex items-center gap-1.5 shrink-0 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">IA EN LÍNEA</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho ── */}
      <div className="flex-1 lg:max-w-[480px] bg-white flex flex-col justify-center px-10 py-12">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/Logo_SIRA_Light.png" alt="SIRA" className="h-24 w-auto object-contain" />
        </div>

        <h3 className="text-2xl font-bold text-navy-dark mb-1">Iniciar sesión en SIRA</h3>
        <p className="text-sm font-semibold text-cyan-600 mb-8">La IA que ayuda a prevenir la deserción estudiantil.</p>

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Correo Electrónico</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="email"
                placeholder="nombre@universidad.edu"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 font-medium"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Contraseña</label>
              <a href="#" className="text-[11px] font-bold text-cyan-600 hover:underline">¿Olvidaste tu contraseña?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input
                type="password"
                placeholder="••••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/20 font-medium"
              />
              <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy-dark">
                <Eye size={18} />
              </button>
            </div>
          </div>

          {/* Remember */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="remember"
              defaultChecked
              className="w-4 h-4 rounded border-slate-300 accent-cyan-500"
            />
            <label htmlFor="remember" className="text-sm font-medium text-slate-600">Recordarme por 30 días</label>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 shadow-xl transition-all hover:opacity-90 hover:scale-[1.01] active:scale-[0.99]"
            style={{ background: 'linear-gradient(90deg, #00b4d8 0%, #00e5ff 100%)' }}
          >
            <LogIn size={18} />
            Iniciar sesión
          </button>
        </form>

        {/* Social */}
        <div className="mt-6">
          <div className="relative mb-5 text-center">
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-100" />
            <span className="relative z-10 bg-white px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">o continuar con</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700 text-sm">
              <GoogleIcon /> Google
            </button>
            <button className="flex items-center justify-center gap-2 border border-slate-200 py-3 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-slate-700 text-sm">
              <MicrosoftIcon /> Microsoft
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          ¿No tienes cuenta?{' '}
          <a href="#" className="font-bold text-cyan-600 hover:underline">Contacta a tu institución.</a>
        </p>
      </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 22 22">
      <rect x="1"  y="1"  width="9" height="9" fill="#f25022"/>
      <rect x="12" y="1"  width="9" height="9" fill="#7fba00"/>
      <rect x="1"  y="12" width="9" height="9" fill="#00a4ef"/>
      <rect x="12" y="12" width="9" height="9" fill="#ffb900"/>
    </svg>
  );
}
