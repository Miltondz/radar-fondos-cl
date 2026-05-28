import { useState } from "react";
import { Zap, X, ArrowRight } from "lucide-react";
import { Fund, MiltonProfile } from "../types";
import { computeNextAction } from "../utils";

interface NextActionBannerProps {
  section: string;
  funds: Fund[];
  starredIds: string[];
  profile: MiltonProfile;
  onNavigateToFund?: (fundId: string) => void;
}

export default function NextActionBanner({
  section,
  funds,
  starredIds,
  profile,
  onNavigateToFund,
}: NextActionBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const action = computeNextAction(section, funds, starredIds, profile);

  if (!action || dismissed) return null;

  return (
    <div className="bg-ink text-paper border-b-2 border-ink px-4 py-3 flex items-center gap-3">
      <div className="shrink-0 p-1.5 bg-warning border border-paper/30">
        <Zap className="h-3.5 w-3.5 text-ink" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-paper/60 block">
          Acción prioritaria
        </span>
        <span className="text-xs font-sans font-bold text-paper truncate block">
          {action.fundName}
          <span className="font-normal text-paper/70 ml-2">— {action.reason}</span>
        </span>
      </div>
      {onNavigateToFund && (
        <button
          onClick={() => onNavigateToFund(action.fundId)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-paper text-ink border border-paper/40 font-mono text-[10px] font-bold uppercase hover:bg-paper-dark transition-colors cursor-pointer"
        >
          {action.ctaLabel} <ArrowRight className="h-3 w-3" />
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 text-paper/50 hover:text-paper cursor-pointer p-1 transition-colors"
        title="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
