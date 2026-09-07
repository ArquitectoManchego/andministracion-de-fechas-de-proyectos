import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  AlertCircle, 
  Zap, 
  CheckCircle2, 
  AlertTriangle,
  FileCheck,
  Building2,
  Truck,
  CloudRain,
  SunMedium
} from 'lucide-react';

export const FODADashboard: React.FC = () => {
  const [checklistState, setChecklistState] = useState<{ [key: string]: boolean }>({
    'cfe-load': false,
    'andamar-permits': false,
    'andamar-cable': false,
    'embroidery-doors': true,
    'cancun-supplies': false,
    'roof-seal': true,
  });

  const toggleCheck = (key: string) => {
    setChecklistState(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-slate-50 space-y-6">
      {/* Encabezado */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-slate-800">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold shadow-inner">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white m-0">Análisis FODA y Matriz de Riesgos Operativos</h2>
            <p className="text-xs text-slate-400 m-0">
              Evaluación estratégica de la aplicación y blindaje de los 8 proyectos concurrentes
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-300 max-w-4xl mt-2 leading-relaxed">
          Este tablero sintetiza los puntos críticos identificados en la planeación para prevenir cuellos de botella burocráticos, fallas mecánicas de maquinaria industrial, riesgos de sobrecosto y la coordinación durante el viaje a Cancún del 15 al 20 de septiembre.
        </p>
      </div>

      {/* Matriz FODA en 4 Cuadrantes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* FORTALEZAS */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-t-emerald-500 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-emerald-800 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>FORTALEZAS (Factores Internos Positivos)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Visión Holística Consolidada:</strong> Visualización Gantt continua de los 8 frentes para evitar olvidar proyectos secundarios por atender la urgencia del día.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Cálculo Automático de Ruta Crítica (CPM):</strong> Alertas inmediatas sobre qué actividades frenan la apertura comercial.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Ubicación Estratégica Casa:</strong> Al estar a media cuadra del local actual de Imperia, el costo y tiempo de mudanza de mercancía se reduce drásticamente.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span><strong>Sinergia de Cuadrillas:</strong> El mismo electricista y albañiles pueden atender los diferentes cuartos y locales dentro de la misma casa reduciendo costos de traslado.</span>
            </li>
          </ul>
        </div>

        {/* OPORTUNIDADES */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-t-blue-500 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-blue-800 font-bold text-sm">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <span>OPORTUNIDADES (Factores Externos Positivos)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span><strong>Apertura Escalonada de Negocios:</strong> Alistar primero Imperia Uniformes y Talleres para generar ingresos y flujo mientras se terminan los locales de alimentos y papelería.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span><strong>Poder de Compra por Volumen:</strong> Adquisición consolidada de cables, tubería y pintura tanto para la casa como para la tirada de 80m de Andamar con descuentos mayoristas.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-500 font-bold">✓</span>
              <span><strong>Delegación y Autonomía Durante Cancún:</strong> Contar con un cronograma transparente permite dejar frentes de obra ejecutándose sin frenar el progreso del 15 al 20 de septiembre.</span>
            </li>
          </ul>
        </div>

        {/* DEBILIDADES */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-t-amber-500 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>DEBILIDADES (Factores Internos a Mitigar)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 font-bold">!</span>
              <span><strong>Dependencia del Gestor Principal:</strong> Alex concentra la toma de decisiones para compras, supervisión de carpintería y cotizaciones simultáneas.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 font-bold">!</span>
              <span><strong>Vulnerabilidad Previa de la Casa:</strong> Al haber sufrido robo de cableado, la casa necesita vigilancia y cerrajería reforzada antes de almacenar maquinaria valiosa.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-amber-500 font-bold">!</span>
              <span><strong>Falta de Tiempo de Amortiguamiento (Slack):</strong> Si se acumulan retrasos en CFE, la mudanza de bordadoras industriales quedará apretada con las fechas de Andamar.</span>
            </li>
          </ul>
        </div>

        {/* AMENAZAS */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-t-rose-500 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm">
            <Zap className="w-5 h-5 text-rose-600" />
            <span>AMENAZAS (Factores Externos y Riesgos)</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-700">
            <li className="flex items-start space-x-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Tiempos de Trámite de CFE:</strong> Si CFE rechaza la mufa o demora la inspección, no se podrá probar ninguna máquina industrial ni aire acondicionado.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Reglamentos Rigurosos de Plaza Andamar:</strong> Exigencia de seguros de responsabilidad civil, altas del IMSS para electricistas y trabajo exclusivamente nocturno (22:00 a 08:00 hrs).</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Clima y Lluvias de Septiembre en Veracruz:</strong> Temporada de tormentas tropicales que pueden interrumpir la impermeabilización de techos o causar goteras si no se sellan a tiempo.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-rose-500 font-bold">✕</span>
              <span><strong>Caída de Tensión Eléctrica en 80m:</strong> Si no se calcula bien el calibre de cable para los 80 metros en Andamar, la cafetera italiana o crepera sufrirán caídas de voltaje.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Lista de Verificación y Mitigación Operativa */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-teal-600" />
          <span>Checklist de Mitigación Operativa y Acciones Preventivas</span>
        </h3>
        <p className="text-xs text-slate-500">
          Marque las acciones recomendadas conforme se vayan confirmando en la obra:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div 
            onClick={() => toggleCheck('cfe-load')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 text-xs ${
              checklistState['cfe-load'] ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input 
              type="checkbox" 
              checked={checklistState['cfe-load']} 
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded" 
            />
            <div>
              <span className="font-bold text-slate-900 block">1. Contrato CFE Bifásico/Trifásico 220V</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Verificar que la preparación de la mufa soporte la carga conjunta de las 4 máquinas industriales, bordadoras, prensas DTF y climas.
              </p>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck('andamar-permits')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 text-xs ${
              checklistState['andamar-permits'] ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input 
              type="checkbox" 
              checked={checklistState['andamar-permits']} 
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded" 
            />
            <div>
              <span className="font-bold text-slate-900 block">2. Permisos y Altas IMSS para Andamar</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Tramitar con anticipación los pases de acceso nocturno (22:00 a 08:00) y constancias patronales para que la plaza no niegue el acceso.
              </p>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck('andamar-cable')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 text-xs ${
              checklistState['andamar-cable'] ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input 
              type="checkbox" 
              checked={checklistState['andamar-cable']} 
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded" 
            />
            <div>
              <span className="font-bold text-slate-900 block">3. Cálculo de Calibre Cable Andamar (80 metros)</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Dimensionar cable mínimo calibre 8 o 6 AWG para evitar caída de tensión con la cafetera italiana (2500W+) y crepera funcionando al unísono.
              </p>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck('embroidery-doors')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 text-xs ${
              checklistState['embroidery-doors'] ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input 
              type="checkbox" 
              checked={checklistState['embroidery-doors']} 
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded" 
            />
            <div>
              <span className="font-bold text-slate-900 block">4. Medición de Vanos para Bordadoras Industriales</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Confirmar que el ancho de puertas y pasillos de la casa permita pasar la bordadora con patín hidráulico sin atorarse.
              </p>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck('cancun-supplies')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 text-xs ${
              checklistState['cancun-supplies'] ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input 
              type="checkbox" 
              checked={checklistState['cancun-supplies']} 
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded" 
            />
            <div>
              <span className="font-bold text-slate-900 block">5. Protocolo de Pago y Suministro Pre-Cancún (14 Sep)</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Dejar materiales de tablaroca y pintura comprados y entregados en la casa antes del día 14 para que las cuadrillas trabajen con autonomía.
              </p>
            </div>
          </div>

          <div 
            onClick={() => toggleCheck('roof-seal')}
            className={`p-3 rounded-lg border cursor-pointer transition flex items-start space-x-3 text-xs ${
              checklistState['roof-seal'] ? 'bg-teal-50 border-teal-300' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <input 
              type="checkbox" 
              checked={checklistState['roof-seal']} 
              onChange={() => {}}
              className="mt-0.5 w-4 h-4 text-teal-600 rounded" 
            />
            <div>
              <span className="font-bold text-slate-900 block">6. Impermeabilización de Techo Antes de Tablaroca</span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Priorizar el sellado de losas para garantizar que ninguna filtración por tormenta de septiembre dañe las placas de tablaroca recién colocadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
