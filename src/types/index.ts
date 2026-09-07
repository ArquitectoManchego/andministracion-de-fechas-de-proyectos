export type CostCategory = 'mano_de_obra' | 'materiales' | 'equipamiento' | 'tramites' | 'otro';

export type GanttZoom = 'day' | 'week' | 'month';

export interface Task {
  id: string;
  projectId: string;
  wbs: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  duration: number;  // en días
  progress: number;  // 0 a 100
  predecessors: string[]; // IDs de tareas predecesoras
  assignedTo: string[];   // Nombres o IDs de responsables
  costEstimated: number;  // Costo total estimado
  costActual: number;     // Costo real ejecutado
  costBreakdown?: {
    manoDeObra: number;
    materiales: number;
    equipamiento: number;
    tramites: number;
  };
  level: number;          // 0: Resumen proyecto, 1: Fase, 2: Tarea, 3: Subtarea
  parentId: string | null;
  isSummary: boolean;
  isMilestone: boolean;
  collapsed?: boolean;
  notes?: string;
  isCritical?: boolean;
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  color: string;
  category: 'casa' | 'comercial' | 'viaje' | 'logistica';
  startDate: string;
  endDate: string;
  budget: number;
  spent: number;
  description: string;
  location: string;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  color: string;
  phone?: string;
  notes?: string;
}

export interface SpecialEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
  color: string;
  type: 'vacation' | 'inspection' | 'deadline';
}
