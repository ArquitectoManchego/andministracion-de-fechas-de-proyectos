import React, { useState, useEffect } from 'react';
import { Task, Project, Resource } from '../types';
import { addDaysToDate, getDaysDiff, formatDate } from '../utils/ganttUtils';
import { X, Calendar, DollarSign, Users, Link2, CheckSquare, Layers } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  tasks: Task[];
  projects: Project[];
  resources: Resource[];
  onSave: (task: Task) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  task,
  tasks,
  projects,
  resources,
  onSave
}) => {
  if (!isOpen || !task) return null;

  const [formData, setFormData] = useState<Task>({ ...task });
  const [activeTab, setActiveTab] = useState<'general' | 'predecessors' | 'resources' | 'costs'>('general');

  useEffect(() => {
    setFormData({ ...task });
  }, [task]);

  const handleDurationChange = (dur: number) => {
    const validDur = Math.max(0, dur);
    const newEnd = validDur === 0 ? formData.startDate : addDaysToDate(formData.startDate, validDur);
    setFormData(prev => ({
      ...prev,
      duration: validDur,
      endDate: newEnd,
      isMilestone: validDur === 0
    }));
  };

  const handleStartDateChange = (newStart: string) => {
    const newEnd = formData.duration === 0 ? newStart : addDaysToDate(newStart, formData.duration);
    setFormData(prev => ({
      ...prev,
      startDate: newStart,
      endDate: newEnd
    }));
  };

  const handleEndDateChange = (newEnd: string) => {
    const diff = getDaysDiff(formData.startDate, newEnd);
    setFormData(prev => ({
      ...prev,
      endDate: newEnd,
      duration: diff,
      isMilestone: diff === 0
    }));
  };

  const handleCostBreakdownChange = (field: 'manoDeObra' | 'materiales' | 'equipamiento' | 'tramites', value: number) => {
    const breakdown = {
      manoDeObra: formData.costBreakdown?.manoDeObra || 0,
      materiales: formData.costBreakdown?.materiales || 0,
      equipamiento: formData.costBreakdown?.equipamiento || 0,
      tramites: formData.costBreakdown?.tramites || 0,
      [field]: Math.max(0, value)
    };
    const total = breakdown.manoDeObra + breakdown.materiales + breakdown.equipamiento + breakdown.tramites;
    setFormData(prev => ({
      ...prev,
      costBreakdown: breakdown,
      costEstimated: total
    }));
  };

  const togglePredecessor = (predId: string) => {
    const current = formData.predecessors || [];
    const exists = current.includes(predId);
    const next = exists ? current.filter(id => id !== predId) : [...current, predId];
    setFormData(prev => ({ ...prev, predecessors: next }));
  };

  const toggleResource = (resId: string) => {
    const current = formData.assignedTo || [];
    const exists = current.includes(resId);
    const next = exists ? current.filter(id => id !== resId) : [...current, resId];
    setFormData(prev => ({ ...prev, assignedTo: next }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              {formData.wbs || 'T'}
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight">{formData.name || 'Nueva Tarea'}</h3>
              <p className="text-xs text-slate-400">Editor de Tarea y Parámetros de Planificación</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas secundarias */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'general'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>General y Fechas</span>
          </button>
          <button
            onClick={() => setActiveTab('predecessors')}
            className={`pb-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'predecessors'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Predecesoras ({formData.predecessors?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`pb-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'resources'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Recursos Asignados ({formData.assignedTo?.length || 0})</span>
          </button>
          <button
            onClick={() => setActiveTab('costs')}
            className={`pb-2 px-3 border-b-2 transition flex items-center space-x-1.5 ${
              activeTab === 'costs'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Desglose de Costos</span>
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Nombre de la Acción / Tarea:</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    placeholder="Ej. Reemplazo de cristales en ventanas rotas"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Código EDT / WBS:</label>
                  <input
                    type="text"
                    value={formData.wbs}
                    onChange={(e) => setFormData({ ...formData, wbs: e.target.value })}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm font-mono focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Proyecto Asignado:</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="w-full border border-slate-300 rounded-md px-3 py-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tiempos y Fechas */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Duración (Días):</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.duration}
                    onChange={(e) => handleDurationChange(parseInt(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm font-bold text-teal-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fecha de Comienzo:</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Fecha de Fin:</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Progreso */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-bold">Porcentaje de Avance Real:</label>
                  <span className="font-bold text-teal-600">{formData.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              {/* Checkboxes de tipo */}
              <div className="flex items-center space-x-6 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isMilestone}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        isMilestone: checked,
                        duration: checked ? 0 : 1,
                        endDate: checked ? formData.startDate : addDaysToDate(formData.startDate, 1)
                      });
                    }}
                    className="w-4 h-4 text-teal-600 rounded"
                  />
                  <span className="text-slate-800 font-medium">Es un Hito (Milestone de entrega o inauguración)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCritical || false}
                    onChange={(e) => setFormData({ ...formData, isCritical: e.target.checked })}
                    className="w-4 h-4 text-rose-600 rounded"
                  />
                  <span className="text-slate-800 font-medium text-rose-700">Ruta Crítica Prioritaria</span>
                </label>
              </div>

              {/* Notas y Especificaciones Técnicas */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">Especificaciones Técnicas / Notas:</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instrucciones específicas (calibre de cable, tipo de soldadura, precauciones de carga, etc.)"
                  className="w-full border border-slate-300 rounded-md p-2 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Pestaña: Predecesoras */}
          {activeTab === 'predecessors' && (
            <div className="space-y-3">
              <p className="text-slate-500">
                Seleccione las tareas que deben concluir antes de que comience esta acción (Relación Fin a Comienzo - FS):
              </p>
              <div className="border border-slate-200 rounded-lg max-h-64 overflow-y-auto divide-y divide-slate-100">
                {tasks
                  .filter(t => t.id !== formData.id && !t.isSummary)
                  .map((t) => {
                    const isSelected = formData.predecessors?.includes(t.id);
                    return (
                      <div
                        key={t.id}
                        onClick={() => togglePredecessor(t.id)}
                        className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition text-xs ${
                          isSelected ? 'bg-teal-50/80 font-semibold text-teal-900' : 'text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 text-teal-600 rounded"
                          />
                          <span className="font-mono text-slate-400 text-[11px]">{t.wbs}</span>
                          <span>{t.name}</span>
                        </div>
                        <span className="text-slate-400 text-[10px] font-mono">
                          Termina: {t.endDate}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Pestaña: Recursos */}
          {activeTab === 'resources' && (
            <div className="space-y-3">
              <p className="text-slate-500">
                Asigne al personal, contratistas o cuadrillas responsables de ejecutar esta tarea:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {resources.map((res) => {
                  const isSelected = formData.assignedTo?.includes(res.id);
                  return (
                    <div
                      key={res.id}
                      onClick={() => toggleResource(res.id)}
                      className={`p-3 rounded-lg border flex items-center space-x-3 cursor-pointer transition ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50/50 text-teal-950 font-bold'
                          : 'border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <div>
                        <p className="text-xs leading-none">{res.name}</p>
                        <p className="text-[10px] text-slate-500 font-normal mt-0.5">{res.role}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pestaña: Costos */}
          {activeTab === 'costs' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-emerald-800 font-bold block">Costo Estimado Total</span>
                  <span className="text-xl font-bold text-emerald-900 font-mono">
                    ${(formData.costEstimated || 0).toLocaleString()} MXN
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-600 font-bold block text-right">Gasto Real Ejecutado</span>
                  <input
                    type="number"
                    min="0"
                    value={formData.costActual || 0}
                    onChange={(e) => setFormData({ ...formData, costActual: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="border border-emerald-300 rounded px-2 py-1 text-sm font-mono text-right w-28 bg-white font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-slate-700">Desglose de Presupuesto por Categoría:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Mano de Obra ($):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costBreakdown?.manoDeObra || 0}
                      onChange={(e) => handleCostBreakdownChange('manoDeObra', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Materiales de Construcción ($):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costBreakdown?.materiales || 0}
                      onChange={(e) => handleCostBreakdownChange('materiales', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Equipamiento y Mobiliario ($):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costBreakdown?.equipamiento || 0}
                      onChange={(e) => handleCostBreakdownChange('equipamiento', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-3 py-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-semibold mb-1">Trámites y Permisos ($):</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.costBreakdown?.tramites || 0}
                      onChange={(e) => handleCostBreakdownChange('tramites', parseInt(e.target.value) || 0)}
                      className="w-full border border-slate-300 rounded-md px-3 py-1.5 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-md shadow-md transition"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
