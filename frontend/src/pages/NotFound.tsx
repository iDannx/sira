import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center py-24">
        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest">404</p>
        <h1 className="mt-2 text-4xl font-bold text-navy-dark">Página no encontrada</h1>
        <p className="mt-2 text-slate-500 font-medium">
          La ruta que buscas no existe o ha sido movida.
        </p>
        <Link
          to="/"
          className="btn-primary inline-block mt-6"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
