// Tipos y mock de respaldo para la vista de Campañas.
// Los datos reales se consumen del backend vía services/campanas.ts
// (que reutiliza /api/automatizaciones bajo la tabla cartera.mcp_estrategias).
// Este mock sirve como referencia del shape y fallback para desarrollo sin backend.

import type { AutomatizacionEstado, AutomatizacionSegmento } from '../types/api';

export type CanalAccion = 'whatsapp' | 'llamada' | 'email' | 'sms';
export type EstadoEjecucion = 'PENDIENTE' | 'EJECUTANDO' | 'COMPLETADA' | 'ERROR';

export interface CampanaListItem {
  id: number;
  nombre: string;
  descripcion: string;
  estado: AutomatizacionEstado;
  creada_por: string;
  segmento_config: AutomatizacionSegmento;
  total_acciones: number;
  ultima_ejecucion: string | null;
  ultimo_estado: EstadoEjecucion | null;
  created_at: string;
}

export interface CampanaAccion {
  id: number;
  tipo: CanalAccion;
  orden: number;
  espera_horas: number;
  config: Record<string, unknown> | null;
}

export interface CampanaEjecucion {
  id: number;
  workflow_n8n_id: string | null;
  estado: EstadoEjecucion;
  resultado: { enviados: number; errores: number } | null;
  created_at: string;
}

export interface CampanaDetalle {
  estrategia: {
    id: number;
    nombre: string;
    descripcion: string | null;
    estado: AutomatizacionEstado;
    creada_por: string | null;
    segmento_config: AutomatizacionSegmento | null;
    created_at: string;
    workflow_n8n_id: string | null;
  };
  acciones: CampanaAccion[];
  ejecuciones: CampanaEjecucion[];
}

export const campanasMock: CampanaListItem[] = [
  {
    id: 1,
    nombre: 'Campaña E Jurídico Mayo 2026',
    descripcion: 'Estrategia para 565 clientes calificación E en estado jurídico. Deuda total $15.7B.',
    estado: 'BORRADOR',
    creada_por: 'ia',
    segmento_config: {
      calificaciones: ['E'],
      dias_mora_min: 360,
      saldo_min: 1_000_000,
      estado_juridico: ['JURIDICO'],
    },
    total_acciones: 4,
    ultima_ejecucion: null,
    ultimo_estado: null,
    created_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 2,
    nombre: 'Cobro preventivo WhatsApp · Mora 1-30',
    descripcion: 'Recordatorios automáticos para clientes en calificación B con mora temprana.',
    estado: 'ACTIVA',
    creada_por: 'usuario',
    segmento_config: {
      calificaciones: ['B'],
      dias_mora_min: 1,
      tipo_credito: ['CONSUMO', 'TARJETA_CREDITO'],
    },
    total_acciones: 3,
    ultima_ejecucion: '2026-05-20T08:30:00.000Z',
    ultimo_estado: 'COMPLETADA',
    created_at: '2026-04-12T09:00:00.000Z',
  },
  {
    id: 3,
    nombre: 'Refinanciación blanda C/D',
    descripcion: 'Ofrece refinanciación con condonación del 11% de moratorios a clientes C y D.',
    estado: 'ACTIVA',
    creada_por: 'ia',
    segmento_config: {
      calificaciones: ['C', 'D'],
      dias_mora_min: 31,
      saldo_min: 500_000,
    },
    total_acciones: 5,
    ultima_ejecucion: '2026-05-22T14:15:00.000Z',
    ultimo_estado: 'COMPLETADA',
    created_at: '2026-03-20T11:30:00.000Z',
  },
  {
    id: 4,
    nombre: 'Cross-sell Tarjeta Gold · Score >800',
    descripcion: 'Oferta de upgrade a tarjeta Gold para clientes A con score alto.',
    estado: 'PAUSADA',
    creada_por: 'usuario',
    segmento_config: {
      calificaciones: ['A'],
      tipo_credito: ['TARJETA_CREDITO'],
    },
    total_acciones: 2,
    ultima_ejecucion: '2026-05-18T12:00:00.000Z',
    ultimo_estado: 'ERROR',
    created_at: '2026-02-10T15:00:00.000Z',
  },
  {
    id: 5,
    nombre: 'Carta jurídica pre-castigo',
    descripcion: 'Última instancia antes de castigo: carta certificada con descuento del 60% en moratorios.',
    estado: 'ACTIVA',
    creada_por: 'ia',
    segmento_config: {
      calificaciones: ['E'],
      dias_mora_min: 180,
      estado_juridico: ['PREJURIDICO', 'JURIDICO'],
    },
    total_acciones: 3,
    ultima_ejecucion: '2026-05-21T09:00:00.000Z',
    ultimo_estado: 'COMPLETADA',
    created_at: '2026-04-05T10:00:00.000Z',
  },
  {
    id: 6,
    nombre: 'Compra de cartera externa · Pagadores A',
    descripcion: 'Identifica pagadores puntuales (A) con créditos en otras entidades.',
    estado: 'COMPLETADA',
    creada_por: 'ia',
    segmento_config: {
      calificaciones: ['A'],
      tipo_credito: ['LIBRE_INVERSION'],
      saldo_min: 5_000_000,
    },
    total_acciones: 4,
    ultima_ejecucion: '2026-05-10T11:00:00.000Z',
    ultimo_estado: 'COMPLETADA',
    created_at: '2026-01-15T12:00:00.000Z',
  },
  {
    id: 7,
    nombre: 'Seguimiento promesas vencidas',
    descripcion: 'Re-contacto automatizado a clientes con promesa de pago vencida sin cumplir.',
    estado: 'ACTIVA',
    creada_por: 'usuario',
    segmento_config: {
      calificaciones: ['C', 'D', 'E'],
      dias_mora_min: 60,
    },
    total_acciones: 3,
    ultima_ejecucion: '2026-05-23T07:00:00.000Z',
    ultimo_estado: 'EJECUTANDO',
    created_at: '2026-04-28T16:00:00.000Z',
  },
];
