import React, { useMemo } from 'react';
import { Project, Task, SpecialEvent } from '../types';
import { 
  Building2, 
  Palmtree, 
  Flag, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Flame,
  ChevronRight
} from 'lucide-react';
import { differenceInCalendarDays, parseISO } from 'date-fns';

interface OverviewDashboardProps {
  projects: Project[];
  tasks: Task[];
  specialEvents: SpecialEvent[];
  onSelectProject: (id: string) => void;
  onGoToGantt: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  projects,
  tasks,
  specialEvents,
  onSelectProject,
  onGoToGantt
}) => {
  // Fecha base: 2026-09-07
  const today = new Date(2026, 8, 7);

  // Cuenta regresiva al viaje de Cancún (15 Sep)
  const daysUntilCancun = useMemo(() => {
    return differenceInCalendarDays(parseISO('2026-09-15'), today);
  }, [today]);

  // Tareas críticas que deben concluir antes del viaje (15 Sep)
  const preCancunTasks = useMemo(() => {
    return tasks.filter(t => !t.isSummary && t.endDate <= '2026-09-15');
  }, [tasks]);

  const preCancunDone = preCancunTasks.filter(t => t.progress === 100);

  // Hitos principales (Milestones)
  const milestones = useMemo(() => {
    return tasks.filter(t => t.isMilestone);
  }, [tasks]);

  // Progreso promedio global
  const globalProgress = useMemo(() => {
    const nonSummaries = tasks.filter(t => !t.isSummary);
    if (nonSummaries.length === 0) return 0;
    const totalProg = nonSummaries.reduce((acc, t) => acc + (t.progress || 0), 0);
    return Math.round(totalProg / nonSummaries.length);
  }, [tasks]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* BANNER ESPECIAL: CUENTA REGRESIVA VIAJE A CANCÚN (15-20 SEP) */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-white shadow-inner flex-shrink-0 text-2xl">
            🌴
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-white/25 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider">
                Ventana de Ausencia Presencial
              </span>
              <span className="text-xs font-semibold opacity-90">15 al 20 de Septiembre</span>
            </div>
            <h3 className="text-xl font-black mt-1">Viaje Veracruz – Bacalar – Moon Palace Cancún</h3>
            <p className="text-xs opacity-90 mt-0.5 max-w-2xl">
              Quedan <strong>{daysUntilCancun} días</strong> para la salida. Todas las compras de material de obra y anticipos a contratistas deben quedar liquidados y entregados antes del 14 de septiembre para evitar paralizar trabajos.
            </p>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-md rounded-xl p-3 border border-white/20 text-center min-w-[170px] flex-shrink-0">
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">Tareas Clave Pre-Viaje</span>
          <span className="text-2xl font-black font-mono mt-0.5 block">
            {preCancunDone.length} / {preCancunTasks.length}
          </span>
          <span className="text-[10px] opacity-90">
            {Math.round((preCancunDone.length / (preCancunTasks.length || 1)) * 100)}% Completadas
          </span>
        </div>
      </div>

      {/* MÉTRICAS EJECUTIVAS GLOBALES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Progreso Global</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{globalProgress}%</span>
            <span className="text-xs text-slate-500">avance promedio</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              style={{ width: `${globalProgress}%` }}
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Frentes Activos</span>
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{projects.length}</span>
            <span className="text-xs text-slate-500">unidades de negocio</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Casa Principal, Talleres y Andamar</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Total Acciones</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{tasks.length}</span>
            <span className="text-xs text-slate-500">tareas y fases</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Estructuradas en jerarquía EDT</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Hitos de Entrega</span>
            <Flag className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{milestones.length}</span>
            <span className="text-xs text-slate-500">metas críticas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">CFE e Inauguración Andamar</p>
        </div>
      </div>

      {/* HITOS CLAVE DE LOS PROYECTOS */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center space-x-2">
          <Flag className="w-4 h-4 text-rose-600" />
          <span>Hitos y Metas Críticas del Calendario</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {milestones.map((m) => (
            <div 
              key={m.id}
              className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-teal-50/50 transition flex items-start space-x-3"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold flex-shrink-0 rotate-45 mt-0.5">
                <Flag className="w-4 h-4 -rotate-45" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">{m.name}</span>
                <span className="text-[11px] font-mono text-teal-700 font-semibold block mt-0.5">
                  Fecha Meta: {m.startDate}
                </span>
                <span className="text-[10px] text-slate-500 block truncate mt-0.5">
                  {m.notes || 'Hito de entrega fundamental'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TARJETAS DE LOS 8 PROYECTOS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900">Estado de los Frentes de Trabajo</h3>
          <button 
            onClick={onGoToGantt}
            className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
          >
            <span>Ver Gantt Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {projects.map((p) => {
            const pTasks = tasks.filter(t => t.projectId === p.id && !t.isSummary);
            const pCompleted = pTasks.filter(t => t.progress === 100);
            const pProg = pTasks.length > 0 
              ? Math.round((pTasks.reduce((acc, t) => acc + (t.progress || 0), 0)) / pTasks.length)
              : 0;

            return (
              <div 
                key={p.id}
                onClick={() => onSelectProject(p.id)}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-teal-400 transition cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span 
                      className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded text-white shadow-xs"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 font-medium">
                      {p.startDate.slice(5)} al {p.endDate.slice(5)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug group-hover:text-teal-700 transition">
                    {p.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-500 font-medium">Avance</span>
                    <span className="font-bold text-teal-700 font-mono">{pProg}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      style={{ width: `${pProg}%`, backgroundColor: p.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                    <span>{pTasks.length} Tareas</span>
                    <span>Presup: ${(p.budget / 1000).toFixed(0)}k</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
