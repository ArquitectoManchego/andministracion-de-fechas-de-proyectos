import React, { useMemo } from 'react';
import { Task, Project } from '../types';
import { DollarSign, TrendingUp, AlertTriangle, PieChart, Wallet, ArrowUpRight } from 'lucide-react';

interface CostDashboardProps {
  tasks: Task[];
  projects: Project[];
}

export const CostDashboard: React.FC<CostDashboardProps> = ({ tasks, projects }) => {
  // Cálculos consolidados
  const summary = useMemo(() => {
    let totalBudget = 0;
    let totalSpent = 0;
    let totalEstimated = 0;

    let totalManoDeObra = 0;
    let totalMateriales = 0;
    let totalEquipamiento = 0;
    let totalTramites = 0;

    projects.forEach(p => {
      totalBudget += p.budget;
    });

    tasks.forEach(t => {
      if (!t.isSummary) {
        totalEstimated += t.costEstimated || 0;
        totalSpent += t.costActual || 0;

        if (t.costBreakdown) {
          totalManoDeObra += t.costBreakdown.manoDeObra || 0;
          totalMateriales += t.costBreakdown.materiales || 0;
          totalEquipamiento += t.costBreakdown.equipamiento || 0;
          totalTramites += t.costBreakdown.tramites || 0;
        }
      }
    });

    return {
      totalBudget,
      totalSpent,
      totalEstimated,
      balance: totalBudget - totalSpent,
      totalManoDeObra,
      totalMateriales,
      totalEquipamiento,
      totalTramites
    };
  }, [projects, tasks]);

  // Desglose por proyecto
  const projectCosts = useMemo(() => {
    return projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id && !t.isSummary);
      const est = pTasks.reduce((acc, t) => acc + (t.costEstimated || 0), 0);
      const act = pTasks.reduce((acc, t) => acc + (t.costActual || 0), 0);
      const diff = p.budget - act;
      const pct = p.budget > 0 ? Math.round((act / p.budget) * 100) : 0;

      return {
        ...p,
        totalEstimated: est,
        totalActual: act,
        diff,
        pct
      };
    });
  }, [projects, tasks]);

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* Tarjetas Superiores de Métricas Financieras */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Presupuesto Global Asignado</p>
            <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
              ${summary.totalBudget.toLocaleString()} MXN
            </h3>
            <p className="text-[11px] text-teal-600 font-medium mt-1">8 Proyectos y Frentes Activos</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Gasto Real Ejecutado</p>
            <h3 className="text-2xl font-black text-amber-600 font-mono mt-1">
              ${summary.totalSpent.toLocaleString()} MXN
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">
              {Math.round((summary.totalSpent / summary.totalBudget) * 100)}% del presupuesto ejercido
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Saldo Remanente Disponible</p>
            <h3 className="text-2xl font-black text-emerald-600 font-mono mt-1">
              ${summary.balance.toLocaleString()} MXN
            </h3>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Fondos disponibles para obra</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Costo Estimado en Tareas</p>
            <h3 className="text-2xl font-black text-slate-700 font-mono mt-1">
              ${summary.totalEstimated.toLocaleString()} MXN
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Total de cotizaciones cargadas</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Distribución por Categoría de Gasto */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <PieChart className="w-4 h-4 text-teal-600" />
          <span>Distribución Estimada por Rubro de Inversión</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Mano de Obra</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              ${summary.totalManoDeObra.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500">Albañiles, electricistas, técnicos</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Materiales</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              ${summary.totalMateriales.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500">Cables THW, pintura, tablaroca, tuberías</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Mobiliario y Equipos</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              ${summary.totalEquipamiento.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500">Kiosco madera, climas, mesas</span>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
            <span className="text-[11px] text-slate-500 font-bold uppercase">Trámites y Permisos</span>
            <p className="text-lg font-bold text-slate-900 font-mono mt-1">
              ${summary.totalTramites.toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500">CFE, agua, permisos Andamar</span>
          </div>
        </div>
      </div>

      {/* Tabla Detallada por Proyecto */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Estado Financiero por Proyecto</h3>
          <span className="text-xs text-slate-500 font-medium">Valores en Pesos Mexicanos (MXN)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-3 py-3">Ubicación</th>
                <th className="px-3 py-3 text-right">Presupuesto</th>
                <th className="px-3 py-3 text-right">Costo Estimado</th>
                <th className="px-3 py-3 text-right">Gastado Real</th>
                <th className="px-3 py-3 text-right">Saldo</th>
                <th className="px-4 py-3 text-center">% Consumido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium text-slate-700">
              {projectCosts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="px-4 py-3 font-semibold text-slate-900 flex items-center space-x-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: p.color }}
                    />
                    <span>{p.name}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-500">{p.location}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold">${p.budget.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-mono text-slate-600">${p.totalEstimated.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-mono text-amber-600 font-bold">${p.totalActual.toLocaleString()}</td>
                  <td className="px-3 py-3 text-right font-mono text-emerald-600 font-bold">${p.diff.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, p.pct)}%` }}
                          className={`h-full ${
                            p.pct > 90 ? 'bg-rose-500' : p.pct > 60 ? 'bg-amber-500' : 'bg-teal-500'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-600">{p.pct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
