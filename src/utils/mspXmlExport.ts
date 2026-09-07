import type { Task, Project } from '../types/index.ts';

function escapeXml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatIsoDateTime(dateStr: string, time: string = '08:00:00'): string {
  if (!dateStr) return `2026-09-08T${time}`;
  const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
  return `${cleanDate}T${time}`;
}

function formatDurationIso(durationDays: number): string {
  const days = Math.max(0, durationDays || 0);
  const hours = days * 8; // Estándar Microsoft Project: 1 día = 8 horas de trabajo
  return `PT${hours}H0M0S`;
}

/**
 * Genera un archivo XML compatible con el esquema de Microsoft Project (MSP XML)
 * para importación directa en Trimble SketchUp con extensiones BIM 4D.
 */
export function generateMsProjectXml(
  projects: Project[],
  tasks: Task[],
  selectedProjectId: string = 'all'
): string {
  // Filtrar tareas según el proyecto seleccionado o todas si es vista consolidada
  const filteredTasks = selectedProjectId === 'all'
    ? tasks
    : tasks.filter(t => t.projectId === selectedProjectId);

  // Nombre del proyecto en metadatos
  const projectName = selectedProjectId === 'all'
    ? 'Cronograma Maestro Multiproyecto - Portafolio'
    : (projects.find(p => p.id === selectedProjectId)?.name || 'Proyecto');

  // Fechas globales del proyecto
  let earliestStart = '2026-09-08';
  let latestFinish = '2026-10-15';

  if (filteredTasks.length > 0) {
    earliestStart = filteredTasks.reduce((min, t) => (t.startDate < min ? t.startDate : min), filteredTasks[0].startDate);
    latestFinish = filteredTasks.reduce((max, t) => (t.endDate > max ? t.endDate : max), filteredTasks[0].endDate);
  }

  // Mapa de IDs a UID numérico correlativo (1-indexed)
  const idToUidMap = new Map<string, number>();
  filteredTasks.forEach((task, index) => {
    idToUidMap.set(task.id, index + 1);
  });

  // Construcción del documento XML
  let xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  xml += '<Project xmlns="http://schemas.microsoft.com/project">\n';
  xml += `  <Name>${escapeXml(projectName)}</Name>\n`;
  xml += `  <StartDate>${formatIsoDateTime(earliestStart, '08:00:00')}</StartDate>\n`;
  xml += `  <FinishDate>${formatIsoDateTime(latestFinish, '18:00:00')}</FinishDate>\n`;
  xml += '  <Tasks>\n';

  filteredTasks.forEach((task, index) => {
    const uid = index + 1;
    const outlineLevel = Math.max(1, (task.level || 0) + 1);
    const isMilestone = task.isMilestone || task.duration === 0 ? 1 : 0;
    const percentComplete = Math.min(100, Math.max(0, Math.round(task.progress || 0)));
    const duration = formatDurationIso(task.duration);

    xml += '    <Task>\n';
    xml += `      <UID>${uid}</UID>\n`;
    xml += `      <ID>${uid}</ID>\n`;
    xml += `      <Name>${escapeXml(task.name)}</Name>\n`;
    xml += `      <Start>${formatIsoDateTime(task.startDate, '08:00:00')}</Start>\n`;
    xml += `      <Finish>${formatIsoDateTime(task.endDate, '18:00:00')}</Finish>\n`;
    xml += `      <Duration>${duration}</Duration>\n`;
    xml += `      <OutlineLevel>${outlineLevel}</OutlineLevel>\n`;
    xml += `      <WBS>${escapeXml(task.wbs || `${uid}`)}</WBS>\n`;
    xml += `      <Milestone>${isMilestone}</Milestone>\n`;
    xml += `      <PercentComplete>${percentComplete}</PercentComplete>\n`;

    // Enlaces de predecesoras (Finish-to-Start = Type 1)
    if (task.predecessors && task.predecessors.length > 0) {
      task.predecessors.forEach((predId) => {
        const predUid = idToUidMap.get(predId);
        if (predUid) {
          xml += '      <PredecessorLink>\n';
          xml += `        <PredecessorUID>${predUid}</PredecessorUID>\n`;
          xml += '        <Type>1</Type>\n'; // 1 = Finish-to-Start (FS)
          xml += '      </PredecessorLink>\n';
        }
      });
    }

    xml += '    </Task>\n';
  });

  xml += '  </Tasks>\n';
  xml += '</Project>\n';

  return xml;
}

/**
 * Dispara la descarga del archivo XML en el navegador
 */
export function downloadMsProjectXml(
  projects: Project[],
  tasks: Task[],
  selectedProjectId: string = 'all'
): void {
  const xmlContent = generateMsProjectXml(projects, tasks, selectedProjectId);
  const blob = new Blob([xmlContent], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const cleanName = selectedProjectId === 'all'
    ? 'cronograma_maestro_bim4d'
    : (projects.find(p => p.id === selectedProjectId)?.code.toLowerCase() || 'proyecto');

  const filename = `${cleanName}_msproject.xml`;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
