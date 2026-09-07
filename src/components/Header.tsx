import React from 'react';
import { Project, GanttZoom } from '../types';
import { 
  Calendar, 
  BarChart3, 
  Users, 
  DollarSign, 
  ShieldAlert, 
  Plus, 
  Download, 
  Upload, 
  Printer, 
  Flame, 
  LayoutDashboard,
  ZoomIn,
  ZoomOut,
  Cloud,
  RefreshCw,
  FileCode
} from 'lucide-react';

interface HeaderProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (id: string) => void;
  activeTab: 'gantt' | 'overview' | 'costs' | 'resources' | 'foda';
  onSelectTab: (tab: 'gantt' | 'overview' | 'costs' | 'resources' | 'foda') => void;
  zoom: GanttZoom;
  onZoomChange: (zoom: GanttZoom) => void;
  showCriticalPath: boolean;
  onToggleCriticalPath: () => void;
  onAddTask: () => void;
  onExport: () => void;
  onExportXml: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrint: () => void;
  cloudSyncStatus?: 'synced' | 'syncing' | 'offline';
}

export const Header: React.FC<HeaderProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  activeTab,
  onSelectTab,
  zoom,
  onZoomChange,
  showCriticalPath,
  onToggleCriticalPath,
  onAddTask,
  onExport,
  onExportXml,
  onImport,
  onPrint,
  cloudSyncStatus = 'synced',
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md no-print select-none">
      {/* Barra superior de marca y controles globales */}
      <div className="px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-teal-500 flex items-center justify-center font-bold text-slate-950 shadow-inner">
            <BarChart3 className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-bold tracking-tight text-white m-0">ProjectMaster Pro</h1>
              <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full font-medium">
                MS Project Engine
              </span>
              {/* Badge de sincronización con Firebase */}
              <div 
                className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-slate-800 border-slate-700 ml-1"
                title="Sincronización en la nube con Firebase Firestore (studio-9900268407-536d0)"
              >
                {cloudSyncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 text-amber-400 animate-spin" />
                    <span className="text-amber-300">Guardando en Firebase...</span>
                  </>
                ) : cloudSyncStatus === 'offline' ? (
                  <>
                    <Cloud className="w-2.5 h-2.5 text-slate-400" />
                    <span className="text-slate-400">Modo Local</span>
                  </>
                ) : (
                  <>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-emerald-300">Firebase Firestore</span>
                  </>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-400 m-0">
              Planificación Multiproyecto: Casa Multinegocios, Andamar y Logística
            </p>
          </div>
        </div>

        {/* Selector de Proyecto */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-medium">Proyecto:</label>
          <select
            value={selectedProjectId}
            onChange={(e) => onSelectProject(e.target.value)}
            className="bg-slate-800 text-sm text-white font-medium border border-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500 max-w-xs"
          >
            <option value="all">📂 Todos los Proyectos (Vista Portafolio Maestra)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Acciones principales */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onAddTask}
            className="flex items-center space-x-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition shadow"
            title="Agregar una nueva tarea o subtarea"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>

          <button
            onClick={onToggleCriticalPath}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md transition border ${
              showCriticalPath
                ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Resaltar tareas en la ruta crítica que determinan la fecha final"
          >
            <Flame className="w-3.5 h-3.5 text-rose-300" />
            <span>Ruta Crítica</span>
          </button>

          {/* Botón Exportar XML MS Project para BIM 4D en SketchUp */}
          <button
            onClick={onExportXml}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-2.5 py-1.5 rounded-md transition shadow border border-blue-500"
            title="Exportar archivo XML compatible con Microsoft Project para extensiones BIM 4D en Trimble SketchUp"
          >
            <FileCode className="w-3.5 h-3.5 text-blue-200" />
            <span>XML MS Project (BIM 4D)</span>
          </button>

          {/* Import / Export / Print */}
          <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
            <button
              onClick={onExport}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Exportar archivo de proyecto (.json)"
            >
              <Download className="w-4 h-4" />
            </button>
            <label
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded cursor-pointer"
              title="Importar archivo de proyecto (.json)"
            >
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={onImport}
                className="hidden"
              />
            </label>
            <button
              onClick={onPrint}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded"
              title="Imprimir / Exportar a PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Pestañas de Navegación y Barra de Herramientas */}
      <div className="px-4 py-1.5 bg-slate-950/70 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 text-xs">
        <nav className="flex space-x-1">
          <button
            onClick={() => onSelectTab('gantt')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'gantt'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Diagrama de Gantt (MS Project)</span>
          </button>

          <button
            onClick={() => onSelectTab('overview')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Resumen Ejecutivo</span>
          </button>

          <button
            onClick={() => onSelectTab('costs')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'costs'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Presupuestos y Costos</span>
          </button>

          <button
            onClick={() => onSelectTab('resources')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'resources'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Recursos & Conflictos</span>
          </button>

          <button
            onClick={() => onSelectTab('foda')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md font-medium transition ${
              activeTab === 'foda'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Análisis FODA & Riesgos</span>
          </button>
        </nav>

        {/* Controles de Escala de Tiempo (Zoom) para el Gantt */}
        {activeTab === 'gantt' && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Escala:</span>
            <div className="flex items-center bg-slate-800 rounded-md border border-slate-700 p-0.5">
              <button
                onClick={() => onZoomChange('day')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  zoom === 'day'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Día
              </button>
              <button
                onClick={() => onZoomChange('week')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  zoom === 'week'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => onZoomChange('month')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                  zoom === 'month'
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mes
              </button>
            </div>
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-700">
              <button
                onClick={() => {
                  if (zoom === 'month') onZoomChange('week');
                  else if (zoom === 'week') onZoomChange('day');
                }}
                disabled={zoom === 'day'}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                title="Acercar escala"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  if (zoom === 'day') onZoomChange('week');
                  else if (zoom === 'week') onZoomChange('month');
                }}
                disabled={zoom === 'month'}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                title="Alejar escala"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
