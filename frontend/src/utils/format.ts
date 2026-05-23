const COP_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const NUMBER_FORMATTER = new Intl.NumberFormat('es-CO');

export function formatCOP(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return COP_FORMATTER.format(value);
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return NUMBER_FORMATTER.format(value);
}

/** Compact COP: $2.46B, $612.45M, $48.7K. */
export function formatCOPCompact(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000_000) return `$${(value / 1_000_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}MM`;
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return COP_FORMATTER.format(value);
}

export function formatPorcentaje(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toFixed(1)}%`;
}

const MES_CORTO: Record<string, string> = {
  '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
  '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic',
};

/** "2026-04" → "Abr 26". "2026-04-30" → "30 Abr". */
export function formatFechaCorta(iso: string): string {
  if (!iso) return '';
  const parts = iso.split('-');
  if (parts.length === 2) {
    const [year, month] = parts;
    return `${MES_CORTO[month] ?? month} ${year.slice(2)}`;
  }
  if (parts.length === 3) {
    const [, month, day] = parts;
    return `${day} ${MES_CORTO[month] ?? month}`;
  }
  return iso;
}

const CALIFICACION_LABEL: Record<string, string> = {
  A: 'Al día',
  B: 'Vencida 1-30 días',
  C: 'Vencida 31-60 días',
  D: 'Vencida 61-120 días',
  E: 'Vencida > 120 días',
};

export function calificacionLabel(cat: string): string {
  return CALIFICACION_LABEL[cat] ?? cat;
}
