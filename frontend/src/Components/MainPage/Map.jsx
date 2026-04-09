import { useEffect, useMemo } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const PROGRAM_STYLES = {
  SSCP: {
    label: "SSCP",
    color: "#22D3EE", // cyan
    glow: "shadow-[0_0_18px_rgba(34,211,238,.55)]",
  },
  CEST: {
    label: "CEST",
    color: "#FDB913", // DOST yellow
    glow: "shadow-[0_0_18px_rgba(253,185,19,.45)]",
  },
  SETUP: {
    label: "SETUP",
    color: "#A78BFA", // violet
    glow: "shadow-[0_0_18px_rgba(167,139,250,.45)]",
  },
  GIA: {
    label: "GIA",
    color: "#34D399", // emerald
    glow: "shadow-[0_0_18px_rgba(52,211,153,.45)]",
  },
};

function createProgramDivIcon({ label, color }) {
  const safeLabel = String(label ?? "").slice(0, 6);

  return L.divIcon({
    className: "dost-program-marker",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
    html: `
      <div class="relative h-7 w-7">
        <span class="absolute inset-0 rounded-full opacity-35 motion-safe:animate-ping" style="background:${color};"></span>
        <span class="absolute inset-0 rounded-full opacity-30 blur-[2px]" style="background:${color};"></span>
        <span class="absolute inset-[5px] rounded-full shadow-[0_0_16px_rgba(255,255,255,.12)] motion-safe:animate-pulse" style="background:${color};"></span>
        <span class="absolute inset-0 grid place-items-center text-[9px] font-extrabold tracking-wide text-white drop-shadow-[0_0_10px_rgba(0,0,0,.85)]">
          ${safeLabel}
        </span>
      </div>
    `.trim(),
  });
}

const Map = () => {
  // Marinduque (approximate) focus area
  const bounds = useMemo(
    () =>
      L.latLngBounds(
        L.latLng(13.12, 121.80), // SW
        L.latLng(13.57, 122.40) // NE
      ),
    []
  );

  // Boac (provincial capital) as focal point
  const center = useMemo(() => L.latLng(13.4463, 122.0837), []);

  const programSites = useMemo(
    () => [
      // NOTE: Sample/demo data only (approximate coordinates for styling/testing)
      {
        id: "sscp-1",
        program: "SSCP",
        name: "SSCP Site A",
        municipality: "Boac",
        coordinates: [13.4463, 122.0837],
      },
      {
        id: "sscp-2",
        program: "SSCP",
        name: "SSCP Site B",
        municipality: "Mogpog",
        coordinates: [13.4946, 121.8652],
      },
      {
        id: "cest-1",
        program: "CEST",
        name: "CEST Community Hub",
        municipality: "Gasan",
        coordinates: [13.3269, 121.8474],
      },
      {
        id: "setup-1",
        program: "SETUP",
        name: "SETUP Partner MSME",
        municipality: "Santa Cruz",
        coordinates: [13.4762, 122.0276],
      },
      {
        id: "gia-1",
        program: "GIA",
        name: "GIA Assisted Group",
        municipality: "Torrijos",
        coordinates: [13.3167, 122.0856],
      },
      {
        id: "setup-2",
        program: "SETUP",
        name: "SETUP Facility Upgrade",
        municipality: "Buenavista",
        coordinates: [13.2556, 122.0468],
      },
    ],
    []
  );

  useEffect(() => {
    // Fix default marker icons in Vite/React bundlers
    // eslint-disable-next-line no-underscore-dangle
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon2x,
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
    });
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-hidden border-y border-white/10 bg-black/40 backdrop-blur">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(99,179,237,.30)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.20)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="text-left">
          <div className="text-xs font-medium tracking-wide text-white/60">
            Focus Map
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white">
            Marinduque, Philippines
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]" />
          Locked bounds
        </div>
      </div>

      <div className="relative h-[calc(100vh-56px)] min-h-[520px] w-full">
        <MapContainer
          center={center}
          zoom={11}
          minZoom={10}
          maxZoom={15}
          maxBounds={bounds}
          maxBoundsViscosity={1.0}
          scrollWheelZoom
          attributionControl={false}
          className="h-full w-full"
        >
          <TileLayer
            // Dark theme tiles for a "technology look"
            // Provider: CartoDB Dark Matter
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />

          <Circle
            center={center}
            radius={12000}
            pathOptions={{
              color: "#22D3EE",
              weight: 2,
              opacity: 0.9,
              fillColor: "#0054A6",
              fillOpacity: 0.18,
            }}
          />

          {programSites.map((site) => {
            const style = PROGRAM_STYLES[site.program] ?? PROGRAM_STYLES.SSCP;
            return (
              <Marker
                key={site.id}
                position={site.coordinates}
                icon={createProgramDivIcon({
                  label: site.program,
                  color: style.color,
                })}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <span style={{ fontWeight: 700 }}>{site.program}</span>{" "}
                  <span style={{ opacity: 0.85 }}>• {site.name}</span>
                </Tooltip>
                <Popup>
                  <div style={{ minWidth: 220 }}>
                    <div style={{ fontWeight: 800 }}>{site.name}</div>
                    <div style={{ marginTop: 6, opacity: 0.85 }}>
                      Program: <b>{site.program}</b>
                      <br />
                      Municipality: <b>{site.municipality}</b>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, opacity: 0.7 }}>
                      Sample marker for UI/design demo.
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          <Marker position={center}>
            <Popup>
              <div style={{ minWidth: 180 }}>
                <div style={{ fontWeight: 700 }}>Marinduque (Boac)</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>
                  Focused technology map view.
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>

        <div className="pointer-events-none absolute left-4 top-4 z-[500] hidden sm:block">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 p-3 text-xs text-white/85 backdrop-blur">
            <div className="text-[11px] font-semibold tracking-wide text-white/80">
              Programs Legend
            </div>
            <div className="mt-2 grid gap-2">
              {Object.entries(PROGRAM_STYLES).map(([key, v]) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="relative inline-flex h-3 w-3 items-center justify-center">
                    <span
                      aria-hidden="true"
                      className="absolute inline-flex h-3 w-3 rounded-full opacity-40 motion-safe:animate-ping"
                      style={{ backgroundColor: v.color }}
                    />
                    <span
                      className={`relative h-2.5 w-2.5 rounded-full ${v.glow} motion-safe:animate-pulse`}
                      style={{ backgroundColor: v.color }}
                    />
                  </span>
                  <span className="font-semibold text-white/90">{v.label}</span>
                  <span className="text-white/50">•</span>
                  <span className="text-white/65">Sites</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-white/55 sm:px-6">
          <div className="truncate">
            Tiles © OpenStreetMap contributors • © CARTO
          </div>
          <div className="hidden sm:block">Zoom: 10–15</div>
        </div>
      </div>
    </div>
  );
};

export default Map;
