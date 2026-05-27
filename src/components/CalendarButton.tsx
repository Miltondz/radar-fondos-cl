import { useState, useEffect } from "react";
import { Calendar, CalendarDays, Check, LogOut, Loader2, Sparkles, AlertCircle, HelpCircle } from "lucide-react";
import { Fund } from "../types";
import { 
  getCachedToken, 
  requestAuthToken, 
  insertCalendarEvent, 
  disconnectGoogle, 
  subscribeToTokenState 
} from "../services/googleCalendar";

interface CalendarButtonProps {
  item: Fund;
  className?: string;
}

export default function CalendarButton({ item, className = "" }: CalendarButtonProps) {
  const [token, setToken] = useState<string | null>(getCachedToken());
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showConfigHint, setShowConfigHint] = useState(false);

  const hasClientId = !!import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Listen to global OAuth token state changes
  useEffect(() => {
    return subscribeToTokenState((newToken) => {
      setToken(newToken);
    });
  }, []);

  const handleActionClick = async () => {
    if (!hasClientId) {
      // Show explanatory modal/hint because Google Client ID is not populated
      setShowConfigHint(true);
      return;
    }

    if (!token) {
      setIsLoading(true);
      try {
        await requestAuthToken((newToken) => {
          setToken(newToken);
          setIsLoading(false);
          // Auto-trigger confirmation after successful auth
          setShowConfirm(true);
        });
      } catch (err: any) {
        setIsLoading(false);
        setStatus("error");
        setErrorMessage(err.message || "Fallo la autorización con Google.");
      }
    } else {
      setShowConfirm(true);
    }
  };

  const handleConfirmInsert = async () => {
    setShowConfirm(false);
    if (!token) return;

    setIsLoading(true);
    setStatus("idle");
    
    const result = await insertCalendarEvent(token, {
      name: item.name,
      deadlineISO: item.deadlineISO || "2026-05-27",
      description: item.description,
      url: item.url,
      chileCode: item.chileCode,
      alertDaysBefore: [1, 3] // Configures custom alert reminders 1 and 3 days before
    });

    setIsLoading(false);
    if (result.success) {
      setStatus("success");
      setTimeout(() => setStatus("idle"), 5000);
    } else {
      setStatus("error");
      setErrorMessage(result.error || "Fallo agregar evento al calendario.");
    }
  };

  const handleLogout = () => {
    disconnectGoogle();
    setStatus("idle");
  };

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-1">
        {status === "success" ? (
          <span className="px-3 py-2 text-[10.5px] font-mono font-bold uppercase border-2 border-safe bg-safe/10 text-safe shrink-0 inline-flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            ¡Agendado con Alertas!
          </span>
        ) : (
          <button
            onClick={handleActionClick}
            disabled={isLoading}
            className={`px-3 py-2 text-[10.5px] font-mono font-bold uppercase border border-ink shrink-0 inline-flex items-center gap-1.5 transition-all cursor-pointer ${
              token 
                ? "bg-accent-blue text-white hover:bg-accent-blue/90 shadow-[2px_2px_0px_#000] active:translate-y-[1px]" 
                : "bg-paper text-ink hover:bg-paper-dark shadow-[2px_2px_0px_#1a1a1a] active:translate-y-[1px]"
            } ${className}`}
          >
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : token ? (
              <Sparkles className="h-3.5 w-3.5 text-warning" />
            ) : (
              <CalendarDays className="h-3.5 w-3.5 text-alert" />
            )}
            {token ? "Agendar Directo" : "Habilitar Agenda Directa"}
          </button>
        )}

        {token && (
          <button
            onClick={handleLogout}
            title="Desconectar cuenta Google"
            className="p-2 border border-ink bg-paper hover:bg-alert/15 text-ink hover:text-alert cursor-pointer transition-colors"
          >
            <LogOut className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Error message bubble */}
      {status === "error" && (
        <div className="absolute left-0 mt-1 bg-alert/10 text-alert border border-alert p-2 text-[10px] font-mono z-20 max-w-[260px] shadow-sm flex items-start gap-1.5 animate-fade-in">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Error del Calendario:</p>
            <p>{errorMessage}</p>
            <button 
              onClick={() => setStatus("idle")} 
              className="underline text-[9px] hover:text-alert/80 mt-1 uppercase font-bold cursor-pointer"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Workspace Mutation Confirmation Dialog Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-ink/75 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-paper border-4 border-ink p-6 max-w-md w-full shadow-[6px_6px_0px_rgba(0,0,0,1)] relative">
            <div className="flex items-start gap-3.5 border-b-2 border-dashed border-ink/20 pb-4">
              <span className="p-2 bg-accent-blue/10 border border-accent-blue text-accent-blue shrink-0">
                <Calendar className="h-6 w-6" />
              </span>
              <div>
                <span className="block text-[9px] font-mono font-bold text-alert uppercase tracking-wider">Confirmación Requerida</span>
                <h4 className="font-serif font-black text-lg text-ink leading-tight">¿Deseas agendar esta convocatoria?</h4>
              </div>
            </div>

            <div className="my-4 font-sans text-xs space-y-2.5 text-ink leading-relaxed">
              <p>
                Se creará el siguiente hito directamente en tu <strong>Google Calendar Principal</strong>:
              </p>
              <div className="bg-paper-dark p-3 border border-ink/25 font-mono">
                <strong className="block text-ink text-xs">{item.name}</strong>
                {item.chileCode && <span className="text-[10px] text-ink/70">ID: {item.chileCode}</span>}
                <span className="block mt-1 text-[10px] text-alert font-bold">Fecha Límite: {item.deadline}</span>
              </div>
              <p className="text-[11px] text-ink/80 border-l-2 border-accent-purple/60 pl-2">
                🔔 <strong>Alertas críticas incluidas:</strong> Te enviaremos notificaciones (popups) de Google Calendar <strong>1 día</strong> y <strong>3 días</strong> antes del cierre para prevenir exclusiones de Milton.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-ink/10">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3.5 py-1.5 font-mono text-xs border border-ink text-ink bg-paper hover:bg-paper-dark cursor-pointer font-bold"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmInsert}
                className="px-4 py-2 font-mono text-xs bg-accent-blue text-white hover:bg-accent-blue/90 border border-ink cursor-pointer font-black shadow-[2px_2px_0px_#000]"
              >
                Sí, Agendar Evento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Helpful Hint modal when Client ID is unconfigured */}
      {showConfigHint && (
        <div className="fixed inset-0 bg-ink/70 backdrop-blur-[1px] flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-paper border-4 border-ink p-6 max-w-md w-full shadow-[6px_6px_0px_rgba(0,0,0,1)]">
            <div className="flex items-center gap-2 mb-3">
              <HelpCircle className="h-5 w-5 text-alert" />
              <h4 className="font-serif font-black text-lg text-ink leading-none">Guía de Configuración Agenda</h4>
            </div>

            <div className="font-sans text-xs space-y-3 text-ink leading-relaxed mb-4">
              <p>
                Para habilitar la sincronización directa con un solo clic y alertas automáticas, tu instancia requiere un Google Client ID.
              </p>
              <p className="font-bold text-[11px] uppercase text-alert">¿Cómo configurarlo en 3 pasos?</p>
              <ol className="list-decimal list-inside space-y-1 bg-paper-dark p-2 text-[10.5px] border border-ink/20 font-mono">
                <li>Ve a Google Cloud Console Credentials</li>
                <li>Crea un "OAuth 2.0 Client ID" tipo Aplicación Web</li>
                <li>Agrega tu Client ID en el panel "Secrets" de AI Studio como <strong className="text-accent-blue">VITE_GOOGLE_CLIENT_ID</strong></li>
              </ol>
              <p className="text-[11px] text-ink/70">
                Mientras lo configuras, puedes seguir usando el botón <strong>"Añadir a Google Agenda"</strong> para generar un enlace rápido de plantilla estándar fácilmente.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowConfigHint(false)}
                className="px-4 py-1.5 font-mono text-xs border-2 border-ink text-ink bg-paper hover:bg-paper-dark cursor-pointer font-extrabold shadow-[2px_2px_0px_#000]"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
