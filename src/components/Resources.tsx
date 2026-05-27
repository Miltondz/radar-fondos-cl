import { useState } from "react";
import { motion } from "motion/react";
import { 
  FileText, Link, ShieldCheck, Download, AlertCircle, Copy, Check, 
  ExternalLink, Sparkles, Building2, UserCheck, HelpCircle 
} from "lucide-react";
import { DOCUMENT_REQUIREMENTS, STRATEGIC_LINKS } from "../data";
import { MiltonProfile } from "../types";

interface ResourcesProps {
  profile: MiltonProfile;
}

export default function Resources({ profile }: ResourcesProps) {
  const [checkedDocs, setCheckedDocs] = useState<string[]>([]);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const toggleDoc = (id: string) => {
    setCheckedDocs(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 1800);
  };

  // Group requirements
  const basicDocs = DOCUMENT_REQUIREMENTS.filter(doc => !doc.isSpecialForkForSpA);
  const spaDocs = DOCUMENT_REQUIREMENTS.filter(doc => doc.isSpecialForkForSpA);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="resources-directory-block">
      
      {/* SECTION 6: Document Checklist Panel */}
      <div className="lg:col-span-7 bg-paper border-2 border-ink p-6 space-y-6 shadow-[4px_4px_0px_#1a1a1a]">
        <div>
          <span className="block text-[10px] font-mono uppercase tracking-widest text-alert font-bold">CARPETA COMPARTIDA</span>
          <h3 className="font-serif font-black text-2xl italic text-ink flex items-center gap-2 mt-0.5">
            <FileText className="h-5 w-5 text-ink" />
            Checklist de Carpetas y Documentos
          </h3>
          <p className="text-xs font-serif text-ink/80 mt-1.5 leading-relaxed">
            Prepara esta carpeta en Drive hoy mismo. Algunos requisitos cambian radicalmente si optas por postular como Persona Natural o mediante SpA.
          </p>
        </div>

        {/* Basic kit */}
        <div className="space-y-3">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink block flex items-center gap-1.5 border-b border-ink/10 pb-1">
            <UserCheck className="h-4 w-4 text-ink" />
            1. REQUISITOS BÁSICOS DE POSTULANTE (Persona Natural / Inicios SII)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {basicDocs.map((doc) => {
              const isChecked = checkedDocs.includes(doc.id);
              const isWomanAlertNeeded = doc.id === "doc-woman" && !profile.hasWoman;

              return (
                <div 
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`border border-ink p-3 cursor-pointer transition-all flex items-start gap-2.5 hover:bg-paper-dark shadow-[1px_1px_0px_rgba(0,0,0,0.15)] ${
                    isChecked 
                      ? "bg-paper-dark opacity-65"
                      : "bg-white"
                  }`}
                >
                  <div className="shrink-0 select-none mt-0.5">
                    {isChecked ? (
                      <div className="flex h-4 w-4 items-center justify-center bg-ink text-paper text-[10px] font-black border border-ink">
                        ✓
                      </div>
                    ) : (
                      <div className="h-4 w-4 border border-ink bg-paper" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`block text-xs font-bold leading-tight ${isChecked ? "text-ink/50 line-through" : "text-ink"}`}>
                      {doc.title}
                    </span>
                    <span className="block text-[10px] text-ink/75 font-serif mt-1 leading-normal">
                      {doc.desc}
                    </span>

                    {/* Gender warning on the specific document */}
                    {isWomanAlertNeeded && (
                      <span className="inline-flex items-center gap-0.5 bg-alert text-white text-[8px] font-mono font-extrabold uppercase py-0.5 px-2 border border-ink mt-1.5">
                        Requiere mujer socia
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SpA kit */}
        <div className="space-y-3 pt-4 border-t border-ink/20">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink block flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-ink" />
              2. EXPEDIENTE CORPORATIVO (Para SpA o Co-Adjudicación)
            </span>
            
            {!profile.hasSpA && (
              <span className="inline-flex items-center gap-1 bg-warning text-ink text-[9.5px] font-mono py-0.5 px-2 border border-ink font-bold animate-pulse">
                <AlertCircle className="h-2.5 w-2.5" />
                Pendiente Constitución
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {spaDocs.map((doc) => {
              const isChecked = checkedDocs.includes(doc.id);
              const alertSpANeeded = !profile.hasSpA;

              return (
                <div 
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`border border-ink p-3 cursor-pointer transition-all flex flex-col justify-between hover:bg-paper-dark bg-white min-h-[105px] shadow-[1px_1px_0px_rgba(0,0,0,0.15)] ${
                    isChecked 
                      ? "bg-paper-dark opacity-65"
                      : ""
                  }`}
                >
                  <div className="flex gap-2.5 items-start">
                    <div className="shrink-0 select-none mt-0.5">
                      {isChecked ? (
                        <div className="flex h-4 w-4 items-center justify-center bg-ink text-paper text-[10px] font-black border border-ink">
                          ✓
                        </div>
                      ) : (
                        <div className="h-4 w-4 border border-ink bg-paper" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className={`block text-xs font-bold leading-tight ${isChecked ? "text-ink/50 line-through" : "text-ink"}`}>
                        {doc.title}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <span className="block text-[9.5px] text-ink/75 font-serif leading-normal mb-1.5">
                      {doc.desc}
                    </span>
                    {alertSpANeeded && (
                      <span className="inline-flex items-center gap-0.5 bg-alert/15 text-alert text-[8px] font-mono font-bold border border-ink uppercase px-1.5 py-0.2">
                        🚧 Esperando SpA
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* SECTION 7: Directory & URLs Panel */}
      <div className="lg:col-span-5 bg-paper border-2 border-ink p-6 space-y-6 flex flex-col justify-between shadow-[4px_4px_0px_#1a1a1a]">
        <div className="space-y-4">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-widest text-alert font-bold">PORTALES GUBERNAMENTALES</span>
            <h3 className="font-serif font-black text-2xl italic text-ink flex items-center gap-2 mt-0.5">
              <Link className="h-5 w-5 text-ink" />
              Canales Oficiales
            </h3>
            <p className="text-xs font-serif text-ink/80 mt-1.5 leading-relaxed">
              URLs auditadas de fomento y portales públicos chilenos para postulación. Evite fraudes y enlaces obsoletos.
            </p>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
            {STRATEGIC_LINKS.map((link) => {
              const isCopied = copiedLinkId === link.id;
              
              return (
                <div 
                  key={link.id}
                  className="bg-paper-dark border border-ink hover:bg-paper p-3.5 flex items-start justify-between gap-3 group transition-all shadow-[1px_1px_0px_rgba(0,0,0,0.1)]"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-ink group-hover:underline">
                        {link.title}
                      </span>
                      <span className="bg-paper border border-ink/40 px-1.5 py-0.2 text-[8px] font-mono text-ink/50 uppercase tracking-wider">
                        ENLACE VERIFICADO
                      </span>
                    </div>
                    <p className="text-[10px] text-ink/75 font-serif leading-normal">
                      {link.desc}
                    </p>
                    <div className="pt-1.5 flex items-center gap-1 text-[10px] text-ink font-mono font-bold">
                      <span>Acción:</span>
                      <span className="font-serif text-alert">{link.action}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-1 mt-1">
                    <button
                      onClick={() => handleCopy(link.id, link.url)}
                      className="p-1.5 bg-paper border border-ink hover:bg-paper-dark text-ink cursor-pointer transition-colors"
                      title="Copiar link"
                    >
                      {isCopied ? <Check className="h-3.5 w-3.5 text-safe" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    
                    <a
                      href={link.url}
                      target="_blank"
                      referrerPolicy="no-referrer"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-paper border border-ink hover:bg-paper-dark text-ink cursor-pointer transition-colors"
                      title="Abrir página"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Decorative alert badge at footer */}
        <div className="bg-paper-dark border border-ink p-3 flex gap-2 shadow-[2px_2px_0px_#1a1a1a]">
          <Sparkles className="h-4 w-4 text-ink shrink-0 mt-0.5" />
          <p className="text-[10px] font-serif text-ink leading-relaxed">
            <span className="font-bold font-sans">Consejo Clave Proveedores:</span> Inscribirse en <strong className="text-alert font-bold">ChileProveedores</strong> requiere Clave Única y la documentación legal de la SpA formalizada. ¡La constitución toma sólo de 3 a 5 días hábiles!
          </p>
        </div>

      </div>

    </div>
  );
}
