import { CheckCircle2, AlertTriangle } from "lucide-react";
import { Fund, MiltonProfile } from "../types";

interface Props {
  fund: Fund;
  profile: MiltonProfile;
}

export default function EligibilityChecklist({ fund, profile }: Props) {
  const checks = [
    fund.eligibilityGenderRequired
      ? { label: "Socia fundadora mujer en el equipo", met: profile.hasWoman }
      : null,
    fund.requiresSpA
      ? { label: "Constitución de Sociedad SpA vigente", met: profile.hasSpA }
      : null,
    fund.SIIRequired
      ? { label: "Iniciación de actividades en SII", met: profile.hasSiiInitiated }
      : null,
    fund.eligibilitySalesRestricted
      ? { label: "Empresa pre-revenue (sin ventas previas)", met: !profile.hasSales }
      : null,
  ].filter(Boolean) as { label: string; met: boolean }[];

  if (checks.length === 0) {
    return (
      <div className="flex items-center gap-2 text-xs p-2 border border-safe/40 bg-safe/5">
        <CheckCircle2 className="h-3.5 w-3.5 text-safe shrink-0" />
        <span className="font-serif text-safe font-semibold">Sin restricciones específicas de perfil — elegible por defecto</span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {checks.map((check, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 text-xs p-2 border ${
            check.met ? "border-safe/30 bg-safe/5" : "border-alert/30 bg-alert/5"
          }`}
        >
          {check.met
            ? <CheckCircle2 className="h-3.5 w-3.5 text-safe shrink-0" />
            : <AlertTriangle className="h-3.5 w-3.5 text-alert shrink-0" />
          }
          <span className={`font-serif flex-1 ${check.met ? "" : "font-semibold text-alert"}`}>
            {check.label}
          </span>
          <span className={`text-[9.5px] font-mono font-black shrink-0 ${check.met ? "text-safe" : "text-alert"}`}>
            {check.met ? "✓ OK" : "✗ Pendiente"}
          </span>
        </div>
      ))}
    </div>
  );
}
