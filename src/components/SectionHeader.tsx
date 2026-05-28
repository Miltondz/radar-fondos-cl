import { useState } from "react";
import { Info } from "lucide-react";
import { SectionCopy } from "../copy";

interface SectionHeaderProps {
  copy: SectionCopy;
}

export default function SectionHeader({ copy }: SectionHeaderProps) {
  const [showHelp, setShowHelp] = useState(false);
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-ink/50 block mb-1">
            {copy.subtitle}
          </span>
          <h2 className="font-display text-3xl font-black text-ink uppercase leading-tight">{copy.title}</h2>
          <p className="text-sm font-serif text-ink/70 mt-1 leading-relaxed max-w-2xl">{copy.description}</p>
        </div>
        <button
          onClick={() => setShowHelp(s => !s)}
          className="shrink-0 p-1.5 text-ink/40 hover:text-ink transition-colors cursor-pointer mt-1"
          title="Cómo usar esta sección"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>
      {showHelp && (
        <div className="bg-paper-dark border border-ink/20 p-4 space-y-2">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-ink/60 mb-1">Cómo usar</p>
          <p className="text-xs font-serif text-ink/70 leading-relaxed">{copy.howToUse}</p>
          {copy.helpItems?.map((item, i) => (
            <p key={i} className="text-xs font-serif text-ink/70 flex items-start gap-2">
              <span className="text-ink/40 mt-0.5 shrink-0">→</span> {item}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
