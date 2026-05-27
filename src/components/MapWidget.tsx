import { useState, useEffect } from "react";
import { MapPin, ExternalLink, Loader2, XCircle } from "lucide-react";

interface MapWidgetProps {
  address: string;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function MapWidget({ address }: MapWidgetProps) {
  const [coords, setCoords] = useState<{ lat: number; lon: number; label: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setCoords(null);

    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1&accept-language=es`,
      { headers: { Accept: "application/json" } }
    )
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((results: NominatimResult[]) => {
        if (cancelled) return;
        if (results.length > 0) {
          setCoords({
            lat: parseFloat(results[0].lat),
            lon: parseFloat(results[0].lon),
            label: results[0].display_name,
          });
        } else {
          setError(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [address]);

  const delta = 0.006; // ~600m radius around point
  const osmEmbedUrl = coords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${coords.lon - delta},${coords.lat - delta},${coords.lon + delta},${coords.lat + delta}&layer=mapnik&marker=${coords.lat},${coords.lon}`
    : null;

  const osmFullUrl = coords
    ? `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lon}#map=17/${coords.lat}/${coords.lon}`
    : `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}`;

  return (
    <div className="border border-ink/30 overflow-hidden bg-paper">
      {/* Map area — 180px tall */}
      <div className="relative" style={{ height: 180 }}>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper-dark/60 gap-2">
            <Loader2 className="h-5 w-5 text-ink/40 animate-spin" />
            <span className="text-[10px] font-mono text-ink/50 uppercase tracking-wider">Geocodificando...</span>
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-paper-dark/60 gap-2 text-center px-4">
            <XCircle className="h-5 w-5 text-ink/35" />
            <p className="text-[10px] font-mono text-ink/50">No se encontró la ubicación</p>
            <a
              href={osmFullUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono font-bold text-accent-blue hover:underline"
            >
              Buscar en OpenStreetMap →
            </a>
          </div>
        )}
        {osmEmbedUrl && !loading && !error && (
          <iframe
            src={osmEmbedUrl}
            width="100%"
            height="180"
            style={{ border: 0, display: "block" }}
            loading="lazy"
            title={`Mapa: ${address}`}
          />
        )}
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-paper-dark border-t border-ink/20">
        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="h-3 w-3 text-alert shrink-0" />
          <span className="text-[10px] font-mono text-ink/65 truncate">{address}</span>
        </div>
        <a
          href={osmFullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono font-bold text-accent-blue hover:underline shrink-0 whitespace-nowrap"
          title="Abrir mapa completo en OpenStreetMap"
        >
          Ver completo <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>
    </div>
  );
}
