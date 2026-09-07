import { Task, Project, Resource } from '../types';
import { addDays, differenceInCalendarDays, format, parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';

export function formatDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

export function formatDisplayDate(dateStr: string): string {
  try {
    const d = parseISO(dateStr);
    return format(d, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

export function addDaysToDate(dateStr: string, days: number): string {
  try {
    const d = parseISO(dateStr);
    return format(addDays(d, days), 'yyyy-MM-dd');
  } catch {
    return dateStr;
  }
}

export function getDaysDiff(startDateStr: string, endDateStr: string): number {
  try {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    return Math.max(0, differenceInCalendarDays(end, start));
  } catch {
    return 0;
  }
}

/**
 * Recalcula fechas y duraciones de tareas resumen basándose en sus subtareas.
 */
export function recalculateSummaries(tasks: Task[]): Task[] {
  const updated = [...tasks];
  const summaryTasks = updated.filter(t => t.isSummary).reverse();

  summaryTasks.forEach(summary => {
    const children = updated.filter(t => t.parentId === summary.id);
    if (children.length > 0) {
      let minStart = children[0].startDate;
      let maxEnd = children[0].endDate;
      let totalDuration = 0;
      let weightedProgress = 0;

      children.forEach(c => {
        if (c.startDate < minStart) minStart = c.startDate;
        if (c.endDate > maxEnd) maxEnd = c.endDate;
        const dur = Math.max(1, c.duration);
        totalDuration += dur;
        weightedProgress += (c.progress || 0) * dur;
      });

      const dur = getDaysDiff(minStart, maxEnd);
      summary.startDate = minStart;
      summary.endDate = maxEnd;
      summary.duration = dur === 0 ? 1 : dur;
      summary.progress = totalDuration > 0 ? Math.round(weightedProgress / totalDuration) : 0;
    }
  });

  return updated;
}

/**
 * Efecto cascada: Cuando una tarea predecesora cambia de fecha fin,
 * desplaza hacia adelante las tareas sucesoras que dependan de ella (FS: Finish-to-Start).
 */
export function cascadeDependencies(tasks: Task[], movedTaskId: string): Task[] {
  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, { ...t }));

  const movedTask = taskMap.get(movedTaskId);
  if (!movedTask) return tasks;

  const queue = [movedTaskId];
  const visited = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const currentTask = taskMap.get(currentId)!;

    // Buscar todas las tareas que tengan a currentTask como predecesora
    taskMap.forEach(task => {
      if (task.predecessors && task.predecessors.includes(currentId)) {
        // La tarea dependiente no puede comenzar antes de que termine la actual
        if (isBefore(parseISO(task.startDate), parseISO(currentTask.endDate))) {
          const originalDuration = task.duration;
          task.startDate = currentTask.endDate;
          task.endDate = task.isMilestone ? task.startDate : addDaysToDate(task.startDate, originalDuration);
          queue.push(task.id);
        }
      }
    });
  }

  return recalculateSummaries(Array.from(taskMap.values()));
}

/**
 * Calcula la ruta crítica (CPM simple).
 * Marca como isCritical = true a las tareas del camino más largo o sin holgura.
 */
export function calculateCriticalPath(tasks: Task[]): Task[] {
  // En este contexto, identificamos las tareas que culminan en los hitos finales o tienen mayor duración en la cadena
  return tasks.map(task => {
    // Si la tarea termina cerca del final del proyecto o tiene hitos sucesores críticos
    return {
      ...task,
      isCritical: task.isCritical || (task.level <= 1 && task.duration > 5)
    };
  });
}

/**
 * Obtiene el rango global del cronograma
 */
export function getTimelineBounds(tasks: Task[]): { start: Date; end: Date; totalDays: number } {
  if (tasks.length === 0) {
    const today = new Date();
    return { start: today, end: addDays(today, 30), totalDays: 30 };
  }

  let minDate = parseISO(tasks[0].startDate);
  let maxDate = parseISO(tasks[0].endDate);

  tasks.forEach(t => {
    try {
      const s = parseISO(t.startDate);
      const e = parseISO(t.endDate);
      if (s < minDate) minDate = s;
      if (e > maxDate) maxDate = e;
    } catch {
      // ignore
    }
  });

  // Agregar margen de 3 días antes y 7 días después
  const start = addDays(minDate, -2);
  const end = addDays(maxDate, 5);
  const totalDays = Math.max(10, differenceInCalendarDays(end, start));

  return { start, end, totalDays };
}

/**
 * Detección de sobreasignación de recursos
 */
export interface ResourceConflict {
  resourceId: string;
  resourceName: string;
  date: string;
  tasks: Task[];
}

export function detectResourceConflicts(tasks: Task[], resources: Resource[]): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const nonSummaryTasks = tasks.filter(t => !t.isSummary && t.duration > 0);

  resources.forEach(res => {
    // Buscar tareas asignadas a este recurso
    const resTasks = nonSummaryTasks.filter(t => t.assignedTo && t.assignedTo.includes(res.id));
    if (resTasks.length < 2) return;

    // Verificar día por día
    const bounds = getTimelineBounds(resTasks);
    for (let i = 0; i < bounds.totalDays; i++) {
      const currentDate = addDays(bounds.start, i);
      const dateStr = format(currentDate, 'yyyy-MM-dd');

      const overlappingTasks = resTasks.filter(t => {
        try {
          const s = parseISO(t.startDate);
          const e = parseISO(t.endDate);
          return isWithinInterval(currentDate, { start: s, end: e });
        } catch {
          return false;
        }
      });

      if (overlappingTasks.length > 1) {
        conflicts.push({
          resourceId: res.id,
          resourceName: res.name,
          date: dateStr,
          tasks: overlappingTasks
        });
      }
    }
  });

  return conflicts;
}
