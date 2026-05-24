import * as XLSX from 'xlsx';
import type {
  ClientePerfilamiento,
  ClienteRecuperacion,
} from '../../data/estrategiasMock';

type FilaPerfilamiento = {
  Nombre: string;
  ID: string;
  'Perfil de comportamiento': string;
  'Producto sugerido': string;
  'Match %': string;
  'Nivel de afinidad': string;
  Estrategia: string;
  'Fecha de generación': string;
};

type FilaRecuperacion = {
  Nombre: string;
  ID: string;
  'Comportamiento de pago': string;
  'Tipo de estrategia': string;
  'Nivel de riesgo': string;
  'Días de mora': number;
  'Monto vencido (COP)': number;
  Estrategia: string;
  'Fecha de generación': string;
};

const toFilaPerfilamiento = (c: ClientePerfilamiento): FilaPerfilamiento => ({
  Nombre: c.nombre,
  ID: `P-${String(c.id).padStart(4, '0')}`,
  'Perfil de comportamiento': c.perfil,
  'Producto sugerido': c.productoSugerido,
  'Match %': `${c.afinidad}%`,
  'Nivel de afinidad': c.nivelAfinidad,
  Estrategia: c.estrategia,
  'Fecha de generación': c.fechaGeneracion,
});

const toFilaRecuperacion = (c: ClienteRecuperacion): FilaRecuperacion => ({
  Nombre: c.nombre,
  ID: `R-${String(c.id).padStart(4, '0')}`,
  'Comportamiento de pago': c.comportamientoPago,
  'Tipo de estrategia': 'Recuperación de cartera',
  'Nivel de riesgo': c.nivelRiesgo,
  'Días de mora': c.diasMora,
  'Monto vencido (COP)': c.montoVencido,
  Estrategia: c.estrategia,
  'Fecha de generación': c.fechaGeneracion,
});

function descargar(filas: object[], hoja: string, archivo: string) {
  if (filas.length === 0) return;
  const ws = XLSX.utils.json_to_sheet(filas);
  // Anchos razonables para evitar columnas pegadas.
  ws['!cols'] = Object.keys(filas[0] as object).map((k) => {
    if (k === 'Estrategia' || k.startsWith('Perfil') || k.startsWith('Comportamiento')) {
      return { wch: 70 };
    }
    if (k === 'Nombre' || k === 'Producto sugerido') return { wch: 28 };
    return { wch: 18 };
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, hoja);
  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${archivo}-${stamp}.xlsx`);
}

export function exportarPerfilamiento(
  clientes: ClientePerfilamiento[],
  sufijo: string,
) {
  descargar(clientes.map(toFilaPerfilamiento), 'Perfilamiento', `estrategias-perfilamiento-${sufijo}`);
}

export function exportarRecuperacion(
  clientes: ClienteRecuperacion[],
  sufijo: string,
) {
  descargar(clientes.map(toFilaRecuperacion), 'Recuperacion', `estrategias-recuperacion-${sufijo}`);
}

export function exportarTodo(
  perfilamiento: ClientePerfilamiento[],
  recuperacion: ClienteRecuperacion[],
) {
  const wb = XLSX.utils.book_new();

  if (perfilamiento.length > 0) {
    const ws1 = XLSX.utils.json_to_sheet(perfilamiento.map(toFilaPerfilamiento));
    ws1['!cols'] = Object.keys(toFilaPerfilamiento(perfilamiento[0])).map((k) =>
      k === 'Estrategia' || k.startsWith('Perfil') ? { wch: 70 } : { wch: 22 },
    );
    XLSX.utils.book_append_sheet(wb, ws1, 'Perfilamiento');
  }

  if (recuperacion.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(recuperacion.map(toFilaRecuperacion));
    ws2['!cols'] = Object.keys(toFilaRecuperacion(recuperacion[0])).map((k) =>
      k === 'Estrategia' || k.startsWith('Comportamiento') ? { wch: 70 } : { wch: 22 },
    );
    XLSX.utils.book_append_sheet(wb, ws2, 'Recuperacion');
  }

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `estrategias-completo-${stamp}.xlsx`);
}
