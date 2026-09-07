import React, { useState, useRef, useMemo } from 'react';
import { Task, Project, Resource, SpecialEvent, GanttZoom } from '../types';
import { 
  formatDate, 
  formatDisplayDate, 
  addDaysToDate, 
  getDaysDiff, 
  getTimelineBounds, 
  cascadeDependencies,
  recalculateSummaries 
} from '../utils/ganttUtils';
import { 
  ChevronRight, 
  ChevronDown, 
  Indent, 
  Outdent, 
  Plus, 
  Trash2, 
  Edit3, 
  Flame, 
  AlertCircle,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import { 
  addDays, 
  differenceInCalendarDays, 
  format, 
  isWeekend, 
  isSameDay, 
  parseISO, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval 
} from 'date-fns';
import { es } from 'date-fns/locale';

interface GanttSplitViewProps {
  tasks: Task[];
  projects: Project[];
  resources: Resource[];
  specialEvents: SpecialEvent[];
  selectedProjectId: string;
  zoom: GanttZoom;
  showCriticalPath: boolean;
  onUpdateTasks: (tasks: Task[]) => void;
  onEditTask: (task: Task) => void;
  onAddTaskBelow: (parentTask?: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export const GanttSplitView: React.FC<GanttSplitViewProps> = ({
  tasks,
  projects,
  resources,
  specialEvents,
  selectedProjectId,
  zoom,
  showCriticalPath,
  onUpdateTasks,
  onEditTask,
  onAddTaskBelow,
  onDeleteTask
}) => {
  // Ancho del panel izquierdo (Grid)
  const [tableWidth, setTableWidth] = useState<number>(580);
  const [isResizingSplit, setIsResizingSplit] = useState<boolean>(false);
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [collapsedSummaries, setCollapsedSummaries] = useState<Set<string>>(new Set());

  // Dragging state for Gantt bars
  const [dragState, setDragState] = useState<{
    taskId: string;
    type: 'move' | 'resize';
    startX: number;
    originalStartDate: string;
    originalEndDate: string;
    originalDuration: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const ganttScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  // Filtrado de tareas según proyecto seleccionado
  const visibleTasks = useMemo(() => {
    let filtered = selectedProjectId === 'all' 
      ? tasks 
      : tasks.filter(t => t.projectId === selectedProjectId);

    // Ocultar hijos de tareas resumen colapsadas
    if (collapsedSummaries.size > 0) {
      filtered = filtered.filter(t => {
        let parentId = t.parentId;
        while (parentId) {
          if (collapsedSummaries.has(parentId)) return false;
          const parent = tasks.find(p => p.id === parentId);
          parentId = parent ? parent.parentId : null;
        }
        return true;
      });
    }

    return filtered;
  }, [tasks, selectedProjectId, collapsedSummaries]);

  // Dimensiones del Gantt según zoom
  const dayWidth = useMemo(() => {
    switch (zoom) {
      case 'day': return 38;
      case 'week': return 18;
      case 'month': return 8;
      default: return 38;
    }
  }, [zoom]);

  const rowHeight = 40;
  const headerHeight = 56;

  // Rango global de fechas
  const timelineBounds = useMemo(() => {
    return getTimelineBounds(tasks);
  }, [tasks]);

  const daysList = useMemo(() => {
    return eachDayOfInterval({
      start: timelineBounds.start,
      end: timelineBounds.end
    });
  }, [timelineBounds]);

  const totalTimelineWidth = daysList.length * dayWidth;

  // Sincronizar scroll vertical entre tabla y timeline
  const handleTableScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (ganttScrollRef.current) {
      ganttScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  const handleGanttScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (tableScrollRef.current) {
      tableScrollRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  // Manejo de colapsar / expandir tareas resumen
  const toggleCollapse = (taskId: string) => {
    const next = new Set(collapsedSummaries);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setCollapsedSummaries(next);
  };

  // Indentar tarea (convertir en subtarea de la anterior)
  const handleIndent = (index: number) => {
    if (index === 0) return;
    const currentTask = visibleTasks[index];
    const prevTask = visibleTasks[index - 1];

    const updated = tasks.map(t => {
      if (t.id === currentTask.id) {
        return {
          ...t,
          parentId: prevTask.id,
          level: prevTask.level + 1
        };
      }
      if (t.id === prevTask.id) {
        return {
          ...t,
          isSummary: true
        };
      }
      return t;
    });

    onUpdateTasks(recalculateSummaries(updated));
  };

  // Desindentar tarea (subir nivel jerárquico)
  const handleOutdent = (task: Task) => {
    if (!task.parentId) return;
    const parent = tasks.find(t => t.id === task.parentId);
    const newParentId = parent ? parent.parentId : null;
    const newLevel = Math.max(0, task.level - 1);

    const updated = tasks.map(t => {
      if (t.id === task.id) {
        return {
          ...t,
          parentId: newParentId,
          level: newLevel
        };
      }
      return t;
    });

    onUpdateTasks(recalculateSummaries(updated));
  };

  // Interacción Drag & Drop para mover barras o redimensionar en el Gantt
  const handleMouseDownBar = (
    e: React.MouseEvent,
    task: Task,
    type: 'move' | 'resize'
  ) => {
    e.stopPropagation();
    if (task.isSummary) return; // Las tareas resumen se calculan automáticamente

    setDragState({
      taskId: task.id,
      type,
      startX: e.clientX,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate,
      originalDuration: task.duration
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Redimensionar ancho del divisor de paneles
    if (isResizingSplit) {
      const newWidth = Math.max(300, Math.min(850, e.clientX));
      setTableWidth(newWidth);
      return;
    }

    // Arrastre de barra Gantt
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaX / dayWidth);

    if (deltaDays === 0) return;

    if (dragState.type === 'move') {
      const newStart = addDaysToDate(dragState.originalStartDate, deltaDays);
      const newEnd = addDaysToDate(dragState.originalEndDate, deltaDays);

      const updated = tasks.map(t => {
        if (t.id === dragState.taskId) {
          return {
            ...t,
            startDate: newStart,
            endDate: newEnd
          };
        }
        return t;
      });

      // Cascada de dependencias automáticas
      onUpdateTasks(cascadeDependencies(updated, dragState.taskId));
    } else if (dragState.type === 'resize') {
      const newDuration = Math.max(1, dragState.originalDuration + deltaDays);
      const newEnd = addDaysToDate(dragState.originalStartDate, newDuration);

      const updated = tasks.map(t => {
        if (t.id === dragState.taskId) {
          return {
            ...t,
            endDate: newEnd,
            duration: newDuration
          };
        }
        return t;
      });

      onUpdateTasks(cascadeDependencies(updated, dragState.taskId));
    }
  };

  const handleMouseUp = () => {
    if (isResizingSplit) setIsResizingSplit(false);
    if (dragState) setDragState(null);
  };

  // Coordenadas X para una fecha dada
  const getXForDate = (dateStr: string): number => {
    try {
      const date = parseISO(dateStr);
      const diff = differenceInCalendarDays(date, timelineBounds.start);
      return diff * dayWidth;
    } catch {
      return 0;
    }
  };

  // Mapa de proyectos por ID
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  // Mapa de recursos por ID
  const resourceMap = useMemo(() => {
    const map = new Map<string, Resource>();
    resources.forEach(r => map.set(r.id, r));
    return map;
  }, [resources]);

  // Fecha actual (Hoy)
  const todayX = useMemo(() => {
    const today = new Date(2026, 8, 7); // 2026-09-07 según contexto del usuario
    const diff = differenceInCalendarDays(today, timelineBounds.start);
    return diff * dayWidth;
  }, [timelineBounds, dayWidth]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 flex overflow-hidden select-none bg-white relative"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* ================================================================= */}
      {/* PANEL IZQUIERDO: TABLA / HOJA DE CÁLCULO ESTILO MICROSOFT PROJECT */}
      {/* ================================================================= */}
      <div 
        style={{ width: `${tableWidth}px` }}
        className="flex flex-col border-r border-slate-300 bg-white flex-shrink-0 z-10 shadow-sm"
      >
        {/* Cabecera de la tabla */}
        <div 
          style={{ height: `${headerHeight}px` }}
          className="bg-slate-100 border-b border-slate-300 text-[11px] font-bold text-slate-700 flex items-center divide-x divide-slate-300"
        >
          <div className="w-9 px-1 text-center text-slate-400">#</div>
          <div className="w-14 px-1 text-center">EDT</div>
          <div className="flex-1 px-3 text-left">Nombre de la Tarea</div>
          <div className="w-16 px-1 text-center">Duración</div>
          <div className="w-20 px-1 text-center">Comienzo</div>
          <div className="w-20 px-1 text-center">Fin</div>
          <div className="w-16 px-1 text-center">Predec.</div>
          <div className="w-24 px-1 text-left truncate">Recursos</div>
          <div className="w-20 px-1 text-right">Costo Est.</div>
          <div className="w-16 px-1 text-center">% Comp.</div>
          <div className="w-20 px-1 text-center">Acciones</div>
        </div>

        {/* Filas de la tabla (Sincronizadas con el Gantt) */}
        <div 
          ref={tableScrollRef}
          onScroll={handleTableScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden divide-y divide-slate-200"
        >
          {visibleTasks.map((task, idx) => {
            const project = projectMap.get(task.projectId);
            const isCritical = showCriticalPath && task.isCritical;
            const hasChildren = tasks.some(t => t.parentId === task.id);
            const isCollapsed = collapsedSummaries.has(task.id);

            return (
              <div 
                key={task.id}
                style={{ height: `${rowHeight}px` }}
                onDoubleClick={() => onEditTask(task)}
                className={`flex items-center text-[11px] divide-x divide-slate-200 hover:bg-teal-50/60 transition group cursor-pointer ${
                  task.isSummary ? 'font-bold bg-slate-50/80 text-slate-900' : 'text-slate-700'
                } ${isCritical ? 'bg-rose-50/40' : ''}`}
              >
                {/* # Número de fila */}
                <div className="w-9 px-1 text-center text-slate-400 font-mono text-[10px]">
                  {idx + 1}
                </div>

                {/* EDT / WBS */}
                <div className="w-14 px-1 text-center font-mono text-[10px] text-slate-500">
                  {task.wbs}
                </div>

                {/* Nombre de la Tarea (con indentación jerárquica) */}
                <div 
                  style={{ paddingLeft: `${task.level * 16 + 8}px` }}
                  className="flex-1 pr-2 flex items-center space-x-1 truncate"
                >
                  {hasChildren ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(task.id);
                      }}
                      className="p-0.5 hover:bg-slate-200 rounded text-slate-600"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : (
                    <span className="w-4 inline-block" />
                  )}

                  {isCritical && (
                    <span title="Ruta Crítica">
                      <Flame className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                    </span>
                  )}

                  <span className="truncate" title={task.name}>
                    {task.name}
                  </span>
                </div>

                {/* Duración */}
                <div className="w-16 px-1 text-center text-slate-600 font-medium">
                  {task.isMilestone ? '0 días' : `${task.duration} d`}
                </div>

                {/* Comienzo */}
                <div className="w-20 px-1 text-center text-slate-600 font-mono text-[10px]">
                  {formatDisplayDate(task.startDate)}
                </div>

                {/* Fin */}
                <div className="w-20 px-1 text-center text-slate-600 font-mono text-[10px]">
                  {formatDisplayDate(task.endDate)}
                </div>

                {/* Predecesoras */}
                <div className="w-16 px-1 text-center text-slate-500 text-[10px] truncate" title={task.predecessors?.join(', ')}>
                  {task.predecessors && task.predecessors.length > 0 
                    ? task.predecessors.map(pId => {
                        const pred = tasks.find(t => t.id === pId);
                        return pred ? pred.wbs : pId;
                      }).join(', ')
                    : '-'}
                </div>

                {/* Recursos */}
                <div className="w-24 px-1.5 text-left truncate text-[10px] text-slate-600">
                  {task.assignedTo && task.assignedTo.length > 0 ? (
                    <span title={task.assignedTo.map(id => resourceMap.get(id)?.name || id).join(', ')}>
                      {task.assignedTo.map(id => resourceMap.get(id)?.name?.split(' ')[0] || id).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </div>

                {/* Costo Estimado */}
                <div className="w-20 px-1 text-right font-mono text-[10px] text-slate-700">
                  ${(task.costEstimated || 0).toLocaleString()}
                </div>

                {/* % Completado */}
                <div className="w-16 px-1 text-center">
                  <div className="flex items-center space-x-1 justify-center">
                    <div className="w-7 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div 
                        style={{ width: `${task.progress || 0}%` }}
                        className={`h-full ${
                          task.progress === 100 ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500">{task.progress || 0}%</span>
                  </div>
                </div>

                {/* Botones de acción rápida por fila */}
                <div className="w-20 px-1 flex items-center justify-center space-x-0.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleIndent(idx);
                    }}
                    title="Indentar (convertir en subtarea)"
                    className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-100 rounded"
                  >
                    <Indent className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOutdent(task);
                    }}
                    disabled={!task.parentId}
                    title="Desindentar"
                    className="p-1 text-slate-500 hover:text-teal-700 hover:bg-teal-100 rounded disabled:opacity-20"
                  >
                    <Outdent className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddTaskBelow(task);
                    }}
                    title="Agregar tarea debajo"
                    className="p-1 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task);
                    }}
                    title="Editar detalles completos"
                    className="p-1 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`¿Eliminar la tarea "${task.name}"?`)) {
                        onDeleteTask(task.id);
                      }
                    }}
                    title="Eliminar tarea"
                    className="p-1 text-slate-500 hover:text-rose-700 hover:bg-rose-100 rounded"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* DIVISOR DE PANELES ARRASTRABLE (SPLITTER) */}
      {/* ================================================================= */}
      <div 
        onMouseDown={() => setIsResizingSplit(true)}
        className="w-1.5 bg-slate-300 hover:bg-teal-500 active:bg-teal-600 cursor-col-resize z-20 flex-shrink-0 transition-colors"
        title="Arrastra para cambiar el ancho de las columnas"
      />

      {/* ================================================================= */}
      {/* PANEL DERECHO: DIAGRAMA DE GANTT (TIMELINE SVG INTERACTIVO) */}
      {/* ================================================================= */}
      <div 
        ref={ganttScrollRef}
        onScroll={handleGanttScroll}
        className="flex-1 overflow-auto bg-slate-50 relative select-none"
      >
        <div style={{ width: `${totalTimelineWidth}px` }} className="relative min-h-full">
          {/* CABECERA TEMPORAL SUPERIOR (Meses y Días) */}
          <div 
            style={{ height: `${headerHeight}px` }}
            className="sticky top-0 z-30 bg-white border-b border-slate-300 shadow-sm"
          >
            {/* Fila 1: Meses */}
            <div className="h-6 flex border-b border-slate-200 text-xs font-bold text-slate-700 bg-slate-100">
              {daysList.map((day, idx) => {
                const isStart = day.getDate() === 1 || idx === 0;
                if (!isStart) return null;
                const monthName = format(day, 'MMMM yyyy', { locale: es }).toUpperCase();
                return (
                  <div 
                    key={idx}
                    style={{ 
                      position: 'absolute', 
                      left: `${idx * dayWidth}px`,
                      width: '250px'
                    }}
                    className="px-2 pt-0.5 text-teal-900 truncate"
                  >
                    {monthName}
                  </div>
                );
              })}
            </div>

            {/* Fila 2: Días / Semanas */}
            <div className="h-8 flex">
              {daysList.map((day, idx) => {
                const weekend = isWeekend(day);
                const isToday = isSameDay(day, new Date(2026, 8, 7));
                return (
                  <div 
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`flex flex-col items-center justify-center border-r border-slate-200 text-[10px] font-medium leading-tight ${
                      weekend ? 'bg-slate-100 text-slate-400' : 'text-slate-600'
                    } ${isToday ? 'bg-amber-100/70 text-amber-900 font-bold' : ''}`}
                  >
                    {zoom === 'day' && (
                      <span className="text-[8px] text-slate-400">
                        {format(day, 'EEE', { locale: es }).toUpperCase().slice(0, 2)}
                      </span>
                    )}
                    <span>{format(day, 'd')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CUERPO DEL GANTT: REJILLA DE FONDO Y BARRAS DE TAREAS */}
          <div className="relative">
            {/* Rejilla de Columnas de Fondo */}
            <div className="absolute inset-0 flex pointer-events-none">
              {daysList.map((day, idx) => {
                const weekend = isWeekend(day);
                return (
                  <div 
                    key={idx}
                    style={{ width: `${dayWidth}px` }}
                    className={`border-r border-slate-200/70 h-full ${
                      weekend ? 'bg-slate-100/50' : ''
                    }`}
                  />
                );
              })}
            </div>

            {/* SOMBREADO ESPECIAL: VIAJE A CANCÚN (15 al 20 de Septiembre) */}
            {specialEvents.map((event) => {
              const eventStartX = getXForDate(event.startDate);
              const eventEndX = getXForDate(addDaysToDate(event.endDate, 1));
              const eventWidth = eventEndX - eventStartX;

              return (
                <div
                  key={event.id}
                  style={{
                    left: `${eventStartX}px`,
                    width: `${eventWidth}px`,
                    top: 0,
                    bottom: 0
                  }}
                  className="absolute z-0 bg-orange-100/40 border-x-2 border-dashed border-orange-400 pointer-events-none"
                >
                  <div className="sticky top-16 mx-2 mt-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md flex items-center space-x-1">
                    <span>🌴 {event.name}</span>
                  </div>
                </div>
              );
            })}

            {/* LÍNEA DE HOY (Today Line) */}
            <div 
              style={{ left: `${todayX + dayWidth / 2}px` }}
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-20 pointer-events-none shadow"
            >
              <div className="sticky top-16 -ml-4 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                HOY
              </div>
            </div>

            {/* LÍNEAS DE FILAS Y BARRAS GANTT */}
            <div className="relative z-10">
              {visibleTasks.map((task, idx) => {
                const taskStartX = getXForDate(task.startDate);
                const taskEndX = getXForDate(task.endDate);
                const taskWidth = Math.max(dayWidth, taskEndX - taskStartX);
                const isCritical = showCriticalPath && task.isCritical;
                const project = projectMap.get(task.projectId);
                const barColor = project ? project.color : '#0d9488';

                return (
                  <div 
                    key={task.id}
                    style={{ height: `${rowHeight}px` }}
                    className="relative border-b border-slate-200/60 flex items-center"
                    onMouseEnter={() => setHoveredTask(task)}
                    onMouseLeave={() => setHoveredTask(null)}
                  >
                    {/* TAREA RESUMEN (Summary Task - Corchete MS Project) */}
                    {task.isSummary ? (
                      <div 
                        style={{
                          left: `${taskStartX}px`,
                          width: `${taskWidth}px`
                        }}
                        className="absolute h-4 flex flex-col justify-center cursor-pointer"
                        onClick={() => onEditTask(task)}
                      >
                        {/* Barra negra superior */}
                        <div className="h-2 bg-slate-800 rounded-xs relative">
                          {/* Puntas hacia abajo del corchete */}
                          <div className="absolute -left-1 bottom-[-4px] border-solid border-t-slate-800 border-t-[6px] border-x-transparent border-x-[4px] border-b-0" />
                          <div className="absolute -right-1 bottom-[-4px] border-solid border-t-slate-800 border-t-[6px] border-x-transparent border-x-[4px] border-b-0" />
                        </div>
                        {/* Etiqueta resumen */}
                        <span className="absolute left-full ml-2 text-[10px] font-bold text-slate-800 whitespace-nowrap">
                          {task.name}
                        </span>
                      </div>
                    ) : task.isMilestone ? (
                      /* HITO (Milestone - Rombo) */
                      <div 
                        style={{ left: `${taskStartX + dayWidth / 2 - 8}px` }}
                        className="absolute flex items-center cursor-pointer"
                        onClick={() => onEditTask(task)}
                      >
                        <div className={`w-4 h-4 rotate-45 border-2 shadow-md ${
                          isCritical 
                            ? 'bg-rose-500 border-rose-700' 
                            : 'bg-amber-500 border-amber-700'
                        }`} />
                        <span className="ml-3 text-[10px] font-bold text-slate-800 whitespace-nowrap">
                          {task.name} ({formatDisplayDate(task.startDate)})
                        </span>
                      </div>
                    ) : (
                      /* TAREA NORMAL (Barra interactiva con progreso) */
                      <div 
                        style={{
                          left: `${taskStartX}px`,
                          width: `${taskWidth}px`,
                          backgroundColor: isCritical ? '#e11d48' : barColor
                        }}
                        className={`absolute h-6 rounded-md shadow-sm border flex items-center overflow-hidden transition-all group/bar cursor-move ${
                          isCritical
                            ? 'bg-rose-500 border-rose-700 text-white'
                            : 'border-slate-400/80 text-white'
                        }`}
                        onMouseDown={(e) => handleMouseDownBar(e, task, 'move')}
                        onClick={() => onEditTask(task)}
                      >
                        {/* Relleno de Progreso interno */}
                        <div 
                          style={{ width: `${task.progress || 0}%` }}
                          className="absolute left-0 top-0 bottom-0 bg-black/25 pointer-events-none"
                        />

                        {/* Texto dentro o fuera de la barra */}
                        <div className="px-2 z-10 flex items-center justify-between w-full text-[10px] font-medium leading-none pointer-events-none truncate">
                          <span className="truncate">{task.name}</span>
                          <span className="text-[9px] opacity-90 ml-1">{task.progress || 0}%</span>
                        </div>

                        {/* Manija de redimensión (arrastrar borde derecho para cambiar duración) */}
                        <div 
                          onMouseDown={(e) => handleMouseDownBar(e, task, 'resize')}
                          className="absolute right-0 top-0 bottom-0 w-2 hover:bg-white/40 cursor-ew-resize opacity-0 group-hover/bar:opacity-100 transition-opacity"
                          title="Arrastrar para ajustar duración"
                        />
                      </div>
                    )}

                    {/* Etiqueta flotante a la derecha de la barra normal */}
                    {!task.isSummary && !task.isMilestone && (
                      <div 
                        style={{ left: `${taskStartX + taskWidth + 8}px` }}
                        className="absolute text-[10px] text-slate-600 whitespace-nowrap pointer-events-none flex items-center space-x-1.5"
                      >
                        <span>{task.assignedTo?.map(id => resourceMap.get(id)?.name?.split(' ')[0] || id).join(', ')}</span>
                        {task.costEstimated > 0 && (
                          <span className="text-slate-400 font-mono">(${task.costEstimated.toLocaleString()})</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FLECHAS CONECTORAS DE DEPENDENCIAS (SVG OVERLAY) */}
            <svg 
              className="absolute inset-0 pointer-events-none z-10"
              style={{ width: `${totalTimelineWidth}px`, height: `${visibleTasks.length * rowHeight}px` }}
            >
              <defs>
                <marker 
                  id="gantt-arrow" 
                  viewBox="0 0 10 10" 
                  refX="6" 
                  refY="5" 
                  markerWidth="5" 
                  markerHeight="5" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
                </marker>
                <marker 
                  id="gantt-arrow-crit" 
                  viewBox="0 0 10 10" 
                  refX="6" 
                  refY="5" 
                  markerWidth="5" 
                  markerHeight="5" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 8 5 L 0 9 z" fill="#e11d48" />
                </marker>
              </defs>

              {visibleTasks.map((task, targetIdx) => {
                if (!task.predecessors || task.predecessors.length === 0) return null;

                return task.predecessors.map((predId) => {
                  const sourceIdx = visibleTasks.findIndex(t => t.id === predId);
                  if (sourceIdx === -1) return null;

                  const predTask = visibleTasks[sourceIdx];
                  const sourceX = getXForDate(predTask.endDate);
                  const sourceY = sourceIdx * rowHeight + rowHeight / 2;

                  const targetX = getXForDate(task.startDate);
                  const targetY = targetIdx * rowHeight + rowHeight / 2;

                  const isCrit = showCriticalPath && (task.isCritical && predTask.isCritical);

                  // Ruta Bezier Finish-to-Start
                  const path = `M ${sourceX} ${sourceY} L ${sourceX + 10} ${sourceY} L ${sourceX + 10} ${targetY} L ${targetX} ${targetY}`;

                  return (
                    <path
                      key={`${predId}-${task.id}`}
                      d={path}
                      fill="none"
                      stroke={isCrit ? '#e11d48' : '#94a3b8'}
                      strokeWidth={isCrit ? '2' : '1.5'}
                      strokeDasharray={isCrit ? undefined : '3,2'}
                      markerEnd={isCrit ? 'url(#gantt-arrow-crit)' : 'url(#gantt-arrow)'}
                    />
                  );
                });
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* TOOLTIP DETALLADO AL PASAR EL CURSOR POR UNA TAREA */}
      {hoveredTask && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white rounded-lg p-3 shadow-xl border border-slate-700 text-xs max-w-sm pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-700 mb-2">
            <span className="font-bold text-teal-400">{hoveredTask.wbs} - {hoveredTask.name}</span>
            {hoveredTask.isCritical && (
              <span className="text-[10px] bg-rose-500/30 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded font-bold">
                Ruta Crítica
              </span>
            )}
          </div>
          <div className="space-y-1 text-slate-300 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Duración:</span>
              <span className="font-semibold text-white">{hoveredTask.duration} días</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Periodo:</span>
              <span>{formatDisplayDate(hoveredTask.startDate)} al {formatDisplayDate(hoveredTask.endDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avance:</span>
              <span className="font-bold text-teal-300">{hoveredTask.progress || 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Costo Estimado:</span>
              <span className="font-mono text-emerald-400">${(hoveredTask.costEstimated || 0).toLocaleString()}</span>
            </div>
            {hoveredTask.assignedTo && hoveredTask.assignedTo.length > 0 && (
              <div className="pt-1">
                <span className="text-slate-400 block mb-0.5">Asignados:</span>
                <span className="text-white font-medium">
                  {hoveredTask.assignedTo.map(id => resourceMap.get(id)?.name || id).join(', ')}
                </span>
              </div>
            )}
            {hoveredTask.notes && (
              <div className="pt-1 text-slate-400 italic text-[10px] border-t border-slate-800 mt-1">
                "{hoveredTask.notes}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
