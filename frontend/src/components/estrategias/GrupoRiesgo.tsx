import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';
import {
  ChevronDown, Download, Eye, X,
} from 'lucide-react';

export interface ColumnaTabla<T> {
  key: string;
  label: string;
  render: (item: T) => ReactNode;
  align?: 'left' | 'right';
  width?: string;
}

export interface GrupoRiesgoProps<T extends { id: number }> {
  nivel: 'Alto' | 'Medio' | 'Bajo';
  colorBadge: string;          // ej. "bg-red-50 text-red-600"
  colorIndicador: string;      // ej. "bg-red-500"
  clientes: T[];
  columnas: ColumnaTabla<T>[];
  initiallyExpanded?: boolean;
  onVerEstrategia: (c: T) => void;
  onExportarGrupo: (clientes: T[]) => void;
  onExportarSeleccionados: (clientes: T[]) => void;
}

export function GrupoRiesgo<T extends { id: number }>({
  nivel,
  colorBadge,
  colorIndicador,
  clientes,
  columnas,
  initiallyExpanded = false,
  onVerEstrategia,
  onExportarGrupo,
  onExportarSeleccionados,
}: GrupoRiesgoProps<T>) {
  const [expandido, setExpandido] = useState(initiallyExpanded);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  // Si la lista de clientes cambia (por filtro o búsqueda), descarta IDs
  // seleccionados que ya no aparecen — evita un contador desincronizado.
  useEffect(() => {
    setSeleccionados((prev) => {
      if (prev.size === 0) return prev;
      const idsVisibles = new Set(clientes.map((c) => c.id));
      const next = new Set<number>();
      prev.forEach((id) => { if (idsVisibles.has(id)) next.add(id); });
      return next.size === prev.size ? prev : next;
    });
  }, [clientes]);

  const todosSeleccionados = useMemo(
    () => clientes.length > 0 && seleccionados.size === clientes.length,
    [seleccionados, clientes.length],
  );
  const algunoSeleccionado = seleccionados.size > 0 && !todosSeleccionados;

  const toggleTodos = () => {
    if (todosSeleccionados) setSeleccionados(new Set());
    else setSeleccionados(new Set(clientes.map((c) => c.id)));
  };
  const toggleUno = (id: number) => {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const limpiarSeleccion = () => setSeleccionados(new Set());

  const seleccionados_array = useMemo(
    () => clientes.filter((c) => seleccionados.has(c.id)),
    [seleccionados, clientes],
  );

  return (
    <section className="glass-card rounded-3xl overflow-hidden">
      <header
        className="flex items-center justify-between gap-4 p-5 cursor-pointer hover:bg-slate-50/40 transition-colors"
        onClick={() => setExpandido((v) => !v)}
      >
        <div className="flex items-center gap-3">
          <span className={clsx('w-2.5 h-2.5 rounded-full', colorIndicador)} />
          <span className={clsx('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest', colorBadge)}>
            {nivel}
          </span>
          <p className="text-sm font-bold text-navy-dark">
            {clientes.length} {clientes.length === 1 ? 'cliente' : 'clientes'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onExportarGrupo(clientes); }}
            disabled={clientes.length === 0}
            className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-[#006875] hover:text-[#006875] rounded-lg px-3 py-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={12} /> Exportar grupo
          </button>
          <ChevronDown
            size={18}
            className={clsx(
              'text-slate-400 transition-transform shrink-0',
              expandido && 'rotate-180',
            )}
          />
        </div>
      </header>

      {expandido && (
        <div className="border-t border-slate-100">
          {seleccionados.size > 0 && (
            <div className="px-5 py-3 bg-[#006875]/5 border-b border-[#006875]/10 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs font-bold text-[#006875]">
                {seleccionados.size} {seleccionados.size === 1 ? 'cliente seleccionado' : 'clientes seleccionados'}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onExportarSeleccionados(seleccionados_array)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#006875] hover:bg-[#004f58] rounded-lg px-3 py-1.5 transition-colors"
                >
                  <Download size={12} /> Exportar seleccionados ({seleccionados.size})
                </button>
                <button
                  onClick={limpiarSeleccion}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-navy-dark rounded-lg px-2 py-1.5 transition-colors"
                >
                  <X size={12} /> Limpiar
                </button>
              </div>
            </div>
          )}

          {clientes.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400 font-medium">
              No hay clientes en este grupo con los filtros actuales.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/40 uppercase tracking-widest text-[9px] font-bold text-slate-400">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        ref={(el) => { if (el) el.indeterminate = algunoSeleccionado; }}
                        onChange={toggleTodos}
                        className="w-4 h-4 rounded border-slate-300 text-[#006875] focus:ring-[#00e5ff]/30 cursor-pointer"
                        aria-label="Seleccionar todos del grupo"
                      />
                    </th>
                    {columnas.map((col) => (
                      <th
                        key={col.key}
                        className={clsx(
                          'px-4 py-3 font-bold',
                          col.align === 'right' && 'text-right',
                          col.width,
                        )}
                      >
                        {col.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 font-bold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {clientes.map((c) => {
                    const checked = seleccionados.has(c.id);
                    return (
                      <tr
                        key={c.id}
                        className={clsx(
                          'hover:bg-slate-50/60 transition-colors',
                          checked && 'bg-[#006875]/5 hover:bg-[#006875]/10',
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleUno(c.id)}
                            className="w-4 h-4 rounded border-slate-300 text-[#006875] focus:ring-[#00e5ff]/30 cursor-pointer"
                            aria-label={`Seleccionar cliente ${c.id}`}
                          />
                        </td>
                        {columnas.map((col) => (
                          <td
                            key={col.key}
                            className={clsx(
                              'px-4 py-3 text-xs',
                              col.align === 'right' && 'text-right',
                            )}
                          >
                            {col.render(c)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => onVerEstrategia(c)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#006875] hover:bg-[#006875]/10 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Eye size={13} /> Ver estrategia
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
