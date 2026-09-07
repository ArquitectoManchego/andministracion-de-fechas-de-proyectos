import React, { useMemo } from 'react';
import { Task, Resource, Project } from '../types';
import { detectResourceConflicts } from '../utils/ganttUtils';
import { Users, AlertTriangle, CheckCircle, Calendar, Briefcase } from 'lucide-react';

interface ResourcesViewProps {
  tasks: Task[];
  resources: Resource[];
  projects: Project[];
  onSelectTask: (task: Task) => void;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  tasks,
  resources,
  projects,
  onSelectTask
}) => {
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    projects.forEach(p => map.set(p.id, p));
    return map;
  }, [projects]);

  // Conflictos de sobreasignación
  const conflicts = useMemo(() => {
    return detectResourceConflicts(tasks, resources);
  }, [tasks, resources]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* Alerta de sobreasignación de personal */}
      {conflicts.length > 0 ? (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-amber-900 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-sm mb-2 text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Atención: Se detectaron {conflicts.length} fechas con tareas simultáneas asignadas al mismo recurso</span>
          </div>
          <p className="text-xs text-amber-800 mb-3">
            Cuando un especialista o responsable tiene dos o más actividades programadas el mismo día en frentes diferentes (ej. Casa y Andamar), se corre riesgo de retraso por falta de supervisión o mano de obra dividida.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {conflicts.slice(0, 6).map((c, i) => (
              <div key={i} className="bg-white/80 rounded-md p-2 text-xs border border-amber-200">
                <span className="font-bold text-amber-950">{c.resourceName}</span> ({c.date}):
                <ul className="list-disc list-inside text-slate-700 text-[11px] mt-1">
                  {c.tasks.map(t => (
                    <li key={t.id} className="truncate">
                      {t.name}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 text-emerald-900 shadow-xs flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-sm">Distribución de Recursos Equilibrada</h4>
            <p className="text-xs text-emerald-800">
              No se detectaron sobreasignaciones críticas en el cronograma actual.
            </p>
          </div>
        </div>
      )}

      {/* Cuadrícula de Recursos y Responsables */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((res) => {
          const assignedTasks = tasks.filter(t => t.assignedTo && t.assignedTo.includes(res.id) && !t.isSummary);
          const completedTasks = assignedTasks.filter(t => t.progress === 100);
          const inProgressTasks = assignedTasks.filter(t => t.progress > 0 && t.progress < 100);
          const totalDuration = assignedTasks.reduce((acc, t) => acc + t.duration, 0);

          return (
            <div 
              key={res.id} 
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-xs text-sm"
                      style={{ backgroundColor: res.color }}
                    >
                      {res.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">{res.name}</h4>
                      <p className="text-xs text-slate-500 font-medium">{res.role}</p>
                    </div>
                  </div>
                </div>

                {/* Métricas rápidas del recurso */}
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">TAREAS</span>
                    <span className="font-bold text-slate-800 text-sm">{assignedTasks.length}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">DÍAS TRAB.</span>
                    <span className="font-bold text-teal-700 text-sm">{totalDuration}d</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-bold">LISTAS</span>
                    <span className="font-bold text-emerald-600 text-sm">{completedTasks.length}</span>
                  </div>
                </div>

                {/* Lista de tareas asignadas */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Actividades Programadas:</p>
                  {assignedTasks.length > 0 ? (
                    assignedTasks.map(t => {
                      const proj = projectMap.get(t.projectId);
                      return (
                        <div
                          key={t.id}
                          onClick={() => onSelectTask(t)}
                          className="p-2 rounded bg-slate-50 hover:bg-teal-50 border border-slate-100 hover:border-teal-200 cursor-pointer transition text-xs flex flex-col space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-800 truncate">{t.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 font-medium">{t.duration}d</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span className="truncate">{proj?.name.slice(0, 20)}</span>
                            <span className="text-teal-600 font-semibold">{t.progress}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">Sin tareas activas asignadas.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
