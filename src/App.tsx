import React, { useState, useEffect, useRef } from 'react';
import { Project, Task, Resource, SpecialEvent, GanttZoom } from './types';
import { 
  INITIAL_PROJECTS, 
  INITIAL_TASKS, 
  INITIAL_RESOURCES, 
  INITIAL_SPECIAL_EVENTS 
} from './data/initialProjects';
import { Header } from './components/Header';
import { GanttSplitView } from './components/GanttSplitView';
import { TaskModal } from './components/TaskModal';
import { CostDashboard } from './components/CostDashboard';
import { ResourcesView } from './components/ResourcesView';
import { FODADashboard } from './components/FODADashboard';
import { OverviewDashboard } from './components/OverviewDashboard';
import { recalculateSummaries, cascadeDependencies } from './utils/ganttUtils';
import { saveToFirebase, getFromFirebase, subscribeToFirebase } from './firebase';

const STORAGE_KEY_PROJECTS = 'projectmaster_projects_v1';
const STORAGE_KEY_TASKS = 'projectmaster_tasks_v1';
const STORAGE_KEY_RESOURCES = 'projectmaster_resources_v1';
const STORAGE_KEY_EVENTS = 'projectmaster_events_v1';

export function App() {
  // Estado de proyectos
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_PROJECTS;
  });

  // Estado de tareas
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return recalculateSummaries(INITIAL_TASKS);
  });

  // Estado de recursos
  const [resources, setResources] = useState<Resource[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_RESOURCES);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_RESOURCES;
  });

  // Eventos especiales (Viaje a Cancún)
  const [specialEvents, setSpecialEvents] = useState<SpecialEvent[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_EVENTS);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SPECIAL_EVENTS;
  });

  // Estado de sincronización en la nube con Firebase
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline'>('syncing');

  // UI States
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'gantt' | 'overview' | 'costs' | 'resources' | 'foda'>('gantt');
  const [zoom, setZoom] = useState<GanttZoom>('day');
  const [showCriticalPath, setShowCriticalPath] = useState<boolean>(true);

  // Modal de edición
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);

  // Persistencia local en LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_RESOURCES, JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EVENTS, JSON.stringify(specialEvents));
  }, [specialEvents]);

  // Sincronización bidireccional y en tiempo real con Firebase Firestore
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    async function initCloudSync() {
      try {
        setCloudSyncStatus('syncing');
        const cloudData = await getFromFirebase();

        if (cloudData && cloudData.projects && cloudData.tasks && cloudData.projects.length > 0) {
          setProjects(cloudData.projects);
          setTasks(recalculateSummaries(cloudData.tasks));
          if (cloudData.resources) setResources(cloudData.resources);
          if (cloudData.specialEvents) setSpecialEvents(cloudData.specialEvents);
          setCloudSyncStatus('synced');
        } else {
          // Primera inicialización en Firestore
          await saveToFirebase({
            projects,
            tasks,
            resources,
            specialEvents
          });
          setCloudSyncStatus('synced');
        }

        // Suscribirse a actualizaciones en vivo
        unsubscribe = subscribeToFirebase((updated) => {
          if (updated && updated.projects && updated.tasks) {
            setProjects(updated.projects);
            setTasks(recalculateSummaries(updated.tasks));
            if (updated.resources) setResources(updated.resources);
            if (updated.specialEvents) setSpecialEvents(updated.specialEvents);
            setCloudSyncStatus('synced');
          }
        });
      } catch (err) {
        console.warn('Operando en modo local (Firebase sin conexión):', err);
        setCloudSyncStatus('offline');
      }
    }

    initCloudSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Función para guardar cambios en Firebase Firestore
  const syncToCloud = async (
    p = projects,
    t = tasks,
    r = resources,
    e = specialEvents
  ) => {
    try {
      setCloudSyncStatus('syncing');
      await saveToFirebase({
        projects: p,
        tasks: t,
        resources: r,
        specialEvents: e
      });
      setCloudSyncStatus('synced');
    } catch (err) {
      console.warn('Fallo al sincronizar con Firebase:', err);
      setCloudSyncStatus('offline');
    }
  };

  // Actualizar tareas con recálculo automático
  const handleUpdateTasks = (newTasks: Task[]) => {
    const recalculated = recalculateSummaries(newTasks);
    setTasks(recalculated);
    syncToCloud(projects, recalculated, resources, specialEvents);
  };

  // Abrir modal de edición
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Guardar tarea editada
  const handleSaveTask = (savedTask: Task) => {
    const exists = tasks.some(t => t.id === savedTask.id);
    let updatedTasks: Task[];

    if (exists) {
      updatedTasks = tasks.map(t => (t.id === savedTask.id ? savedTask : t));
    } else {
      updatedTasks = [...tasks, savedTask];
    }

    // Cascada de dependencias y cálculo de resumen
    const cascaded = cascadeDependencies(updatedTasks, savedTask.id);
    const finalTasks = recalculateSummaries(cascaded);
    setTasks(finalTasks);
    syncToCloud(projects, finalTasks, resources, specialEvents);
  };

  // Agregar una nueva tarea
  const handleAddNewTask = () => {
    const targetProject = selectedProjectId === 'all' ? projects[0].id : selectedProjectId;
    const newTask: Task = {
      id: `t-new-${Date.now()}`,
      projectId: targetProject,
      wbs: `${tasks.length + 1}`,
      name: 'Nueva Acción / Tarea',
      startDate: '2026-09-08',
      endDate: '2026-09-10',
      duration: 2,
      progress: 0,
      predecessors: [],
      assignedTo: ['res-alex'],
      costEstimated: 3000,
      costActual: 0,
      level: 1,
      parentId: null,
      isSummary: false,
      isMilestone: false,
      costBreakdown: {
        manoDeObra: 1500,
        materiales: 1500,
        equipamiento: 0,
        tramites: 0
      }
    };
    setEditingTask(newTask);
    setIsTaskModalOpen(true);
  };

  // Agregar subtarea o tarea debajo
  const handleAddTaskBelow = (parentTask?: Task) => {
    const targetProject = parentTask ? parentTask.projectId : (selectedProjectId === 'all' ? projects[0].id : selectedProjectId);
    const parentId = parentTask ? (parentTask.isSummary ? parentTask.id : parentTask.parentId) : null;
    const level = parentTask ? (parentTask.isSummary ? parentTask.level + 1 : parentTask.level) : 1;

    const newTask: Task = {
      id: `t-sub-${Date.now()}`,
      projectId: targetProject,
      wbs: parentTask ? `${parentTask.wbs}.1` : `${tasks.length + 1}`,
      name: 'Nueva Subtarea',
      startDate: parentTask ? parentTask.startDate : '2026-09-08',
      endDate: parentTask ? parentTask.endDate : '2026-09-10',
      duration: 2,
      progress: 0,
      predecessors: parentTask ? [parentTask.id] : [],
      assignedTo: ['res-alex'],
      costEstimated: 2000,
      costActual: 0,
      level,
      parentId,
      isSummary: false,
      isMilestone: false
    };

    setEditingTask(newTask);
    setIsTaskModalOpen(true);
  };

  // Eliminar tarea
  const handleDeleteTask = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId && t.parentId !== taskId);
    const finalTasks = recalculateSummaries(updated);
    setTasks(finalTasks);
    syncToCloud(projects, finalTasks, resources, specialEvents);
  };

  // Exportar proyecto a JSON
  const handleExport = () => {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      projects,
      tasks,
      resources,
      specialEvents
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan_proyectos_gantt_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Importar proyecto desde JSON
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const content = evt.target?.result as string;
        const parsed = JSON.parse(content);

        if (parsed.projects && parsed.tasks) {
          setProjects(parsed.projects);
          const finalTasks = recalculateSummaries(parsed.tasks);
          setTasks(finalTasks);
          if (parsed.resources) setResources(parsed.resources);
          if (parsed.specialEvents) setSpecialEvents(parsed.specialEvents);
          syncToCloud(parsed.projects, finalTasks, parsed.resources, parsed.specialEvents);
          alert('¡Proyecto cargado y sincronizado con Firebase exitosamente!');
        } else {
          alert('El archivo no contiene una estructura válida de proyecto.');
        }
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Imprimir / Guardar a PDF
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100">
      {/* Barra de Navegación y Herramientas Superior */}
      <Header
        projects={projects}
        selectedProjectId={selectedProjectId}
        onSelectProject={setSelectedProjectId}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        zoom={zoom}
        onZoomChange={setZoom}
        showCriticalPath={showCriticalPath}
        onToggleCriticalPath={() => setShowCriticalPath(!showCriticalPath)}
        onAddTask={handleAddNewTask}
        onExport={handleExport}
        onImport={handleImport}
        onPrint={handlePrint}
        cloudSyncStatus={cloudSyncStatus}
      />

      {/* Vistas Principales */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'gantt' && (
          <GanttSplitView
            tasks={tasks}
            projects={projects}
            resources={resources}
            specialEvents={specialEvents}
            selectedProjectId={selectedProjectId}
            zoom={zoom}
            showCriticalPath={showCriticalPath}
            onUpdateTasks={handleUpdateTasks}
            onEditTask={handleEditTask}
            onAddTaskBelow={handleAddTaskBelow}
            onDeleteTask={handleDeleteTask}
          />
        )}

        {activeTab === 'overview' && (
          <OverviewDashboard
            projects={projects}
            tasks={tasks}
            specialEvents={specialEvents}
            onSelectProject={(id) => {
              setSelectedProjectId(id);
              setActiveTab('gantt');
            }}
            onGoToGantt={() => setActiveTab('gantt')}
          />
        )}

        {activeTab === 'costs' && (
          <CostDashboard
            tasks={tasks}
            projects={projects}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesView
            tasks={tasks}
            resources={resources}
            projects={projects}
            onSelectTask={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
          />
        )}

        {activeTab === 'foda' && (
          <FODADashboard />
        )}
      </main>

      {/* Modal de edición/creación de tareas */}
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        task={editingTask}
        tasks={tasks}
        projects={projects}
        resources={resources}
        onSave={handleSaveTask}
      />
    </div>
  );
}

export default App;
