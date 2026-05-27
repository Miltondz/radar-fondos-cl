import { motion } from "motion/react";
import { User, ShieldAlert, Sparkles, AlertCircle, CheckCircle, TrendingUp, HelpCircle } from "lucide-react";
import { MiltonProfile } from "../types";

interface MiltonOptimizerProps {
  profile: MiltonProfile;
  onChange: (updated: MiltonProfile) => void;
}

export default function MiltonOptimizer({ profile, onChange }: MiltonOptimizerProps) {
  const toggleWoman = () => onChange({ ...profile, hasWoman: !profile.hasWoman });
  const toggleSpA = () => onChange({ ...profile, hasSpA: !profile.hasSpA });
  const toggleSales = () => onChange({ ...profile, hasSales: !profile.hasSales });
  const toggleSII = () => onChange({ ...profile, hasSiiInitiated: !profile.hasSiiInitiated });

  return (
    <div className="bg-paper-dark border-2 border-ink p-6 relative overflow-hidden shadow-[4px_4px_0px_#1a1a1a]" id="milton-optimizer">
      {/* Editorial top line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-ink" />
      
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        
        {/* Profile Card Summary */}
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-ink bg-paper text-ink shrink-0">
              <User className="h-6 w-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-serif font-black text-xl italic text-ink text-left">Perfil Estratégico: Milton</h3>
                <span className="bg-ink px-1.5 py-0.5 text-[9px] font-mono text-paper uppercase font-bold tracking-wider">
                  SaaS / AI Aplicada
                </span>
              </div>
              <p className="text-xs font-mono text-ink/75 mt-0.5">Región Metropolitana • Fundador TI • Sin Empresa constituida</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="bg-paper border border-ink p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
              <span className="block text-[9px] font-mono text-ink/60 uppercase tracking-wider">Localidad</span>
              <span className="text-sm font-bold text-ink">R. Metropolitana</span>
            </div>
            
            <div className="bg-paper border border-ink p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
              <span className="block text-[9px] font-mono text-ink/60 uppercase tracking-wider">Vertical Clave</span>
              <span className="text-sm font-bold text-ink">Software / SaaS</span>
            </div>

            <div className="col-span-2 sm:col-span-1 bg-paper border border-ink p-3 shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">
              <span className="block text-[9px] font-mono text-ink/60 uppercase tracking-wider">Estado Financiero</span>
              <span className={`text-sm font-bold ${profile.hasSales ? "text-safe" : "text-alert"}`}>
                {profile.hasSales ? "Facturando" : "Idea / Sin ventas"}
              </span>
            </div>
          </div>

          {/* Dynamic Advice Panel - Styled like a newspaper sidebar cutout */}
          <div className="mt-5 bg-paper border-l-4 border-l-ink border border-ink p-4">
            <div className="flex gap-3">
              <Sparkles className="h-5 w-5 text-alert shrink-0 mt-0.5" />
              <div className="text-xs text-ink/90 leading-relaxed font-serif">
                <strong className="text-ink font-sans text-[10px] uppercase tracking-wider block mb-1">Nota Técnica del Analista:</strong>{" "}
                {profile.hasWoman ? (
                  <span>
                    ¡Estructura de género calificada! Al registrar una socia fundadora, Milton desbloquea cupos garantizados en 
                    <strong className="font-bold border-b border-alert text-alert"> Capital Abeja (Sercotec)</strong>, 
                    <strong className="font-bold border-b border-alert text-alert"> Capital Pioneras</strong> y el beneficio extra de 
                    <strong className="font-bold border-b border-alert text-alert"> Semilla Inicia Mujeres ($17M)</strong>. Esto duplica las probabilidades ponderadas de éxito.
                  </span>
                ) : (
                  <span>
                    El perfil de Milton carece de facturas previas, lo cual es ideal para fondos early-stage. 
                    Si agrega una <strong className="font-bold text-ink underline">socia comercial al directorio</strong>, activará 
                    <strong className="font-bold text-alert"> +$19.5M en fondos especiales de género</strong> con bases flexibilizadas.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Interactive Switches - Print simulation block */}
        <div className="w-full lg:w-96 bg-paper border border-ink p-5 flex flex-col gap-4 shadow-[3px_3px_0px_rgba(0,0,0,0.15)]">
          <h4 className="font-mono text-[10px] font-black text-ink uppercase tracking-widest flex items-center justify-between border-b border-ink/25 pb-2">
            <span>Simulador de Elegibilidad</span>
            <span className="text-[9px] font-sans text-alert font-bold uppercase blink">Interactuar ↓</span>
          </h4>

          {/* Toggle Unit 1 */}
          <div className="flex items-center justify-between py-1 border-b border-ink/10">
            <div>
              <span className="block text-xs font-bold text-ink">¿Hay mujer en el equipo fundador?</span>
              <span className="block text-[10px] text-ink/75">Socia con participación accionaria activa</span>
            </div>
            <button
              onClick={toggleWoman}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-ink transition-colors duration-150 ease-in-out focus:outline-none ${
                profile.hasWoman ? "bg-alert" : "bg-paper-dark"
              }`}
              type="button"
              id="switch-has-woman"
              aria-label="Toggle woman in team"
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform border border-ink bg-white transition duration-150 ease-in-out ${
                  profile.hasWoman ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle Unit 2 */}
          <div className="flex items-center justify-between py-1 border-b border-ink/10">
            <div>
              <span className="block text-xs font-bold text-ink">¿Crear e iniciar SpA mercantil?</span>
              <span className="block text-[10px] text-ink/75">Empresa jurídica registrada en Chile</span>
            </div>
            <button
              onClick={toggleSpA}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-ink transition-colors duration-150 ease-in-out focus:outline-none ${
                profile.hasSpA ? "bg-ink" : "bg-paper-dark"
              }`}
              type="button"
              id="switch-has-spa"
              aria-label="Toggle company SpA"
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform border border-ink bg-white transition duration-150 ease-in-out ${
                  profile.hasSpA ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle Unit 3 */}
          <div className="flex items-center justify-between py-1 border-b border-ink/10">
            <div>
              <span className="block text-xs font-bold text-ink">¿Iniciación del SII en marcha?</span>
              <span className="block text-[10px] text-ink/75">Persona natural o jurídica con giro SII</span>
            </div>
            <button
              onClick={toggleSII}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-ink transition-colors duration-150 ease-in-out focus:outline-none ${
                profile.hasSiiInitiated ? "bg-ink" : "bg-paper-dark"
              }`}
              type="button"
              id="switch-sii-active"
              aria-label="Toggle SII activity initiation"
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform border border-ink bg-white transition duration-150 ease-in-out ${
                  profile.hasSiiInitiated ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Toggle Unit 4 */}
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="block text-xs font-bold text-ink">¿Tiene ventas facturadas?</span>
              <span className="block text-[10px] text-ink/75">Ventas registradas ante SII mayores a $0</span>
            </div>
            <button
              onClick={toggleSales}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer border-2 border-ink transition-colors duration-150 ease-in-out focus:outline-none ${
                profile.hasSales ? "bg-safe" : "bg-paper-dark"
              }`}
              type="button"
              id="switch-has-sales"
              aria-label="Toggle sales status"
            >
              <span
                className={`pointer-events-none inline-block h-4.5 w-4.5 transform border border-ink bg-white transition duration-150 ease-in-out ${
                  profile.hasSales ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          
        </div>

      </div>
    </div>
  );
}
