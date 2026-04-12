import { useEffect, useMemo, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";

import { fetchProjects } from "../../api/projectsApi";
import { useGeolocation } from "../../hooks/useGeolocation";
import { getGoogleMapsDirectionsUrl } from "../../utils/googleMaps";
import {
  PROGRAM_ORDER,
  countMapSitesByProgramType,
  projectsToMapSites,
} from "../../utils/projectSites";
import MapUserLocation from "../Map/MapUserLocation";
import {
  PROGRAM_STYLES,
  createProgramDivIcon,
  fixLeafletDefaultIcons,
} from "../Map/programMarkers";

const Map = () => {
  const geo = useGeolocation();
  const userLocation =
    geo.lat != null &&
    geo.lng != null &&
    !Number.isNaN(geo.lat) &&
    !Number.isNaN(geo.lng)
      ? {
          lat: geo.lat,
          lng: geo.lng,
          accuracy: geo.accuracy,
        }
      : null;

  const [projects, setProjects] = useState([]);
  const programSites = useMemo(
    () => projectsToMapSites(projects),
    [projects]
  );
  const mapCountsByProgram = useMemo(
    () => countMapSitesByProgramType(projects),
    [projects]
  );
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchProjects();
        if (!cancelled) setProjects(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setProjects([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    fixLeafletDefaultIcons();
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
        <div className="flex flex-col items-end gap-1">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]" />
            {programSites.length} site{programSites.length === 1 ? "" : "s"}
          </div>
          <div className="max-w-[min(100vw-2rem,240px)] text-right text-[10px] leading-tight text-white/50">
            {geo.loading ? (
              <span className="text-sky-300/90">Finding your location…</span>
            ) : geo.error ? (
              <span title={geo.error}>Location: {geo.error}</span>
            ) : userLocation ? (
              <span className="text-emerald-300/90">Your location is on the map</span>
            ) : null}
          </div>
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

          <MapUserLocation position={userLocation} bounds={bounds} />

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
                  <div style={{ minWidth: 220, color: "#0f172a" }}>
                    <div style={{ fontWeight: 800 }}>{site.name}</div>
                    <div style={{ marginTop: 6, opacity: 0.9, fontSize: 13 }}>
                      Program: <b>{site.program}</b>
                      <br />
                      Beneficiary: <b>{site.municipality}</b>
                      <br />
                      Status: <b>{site.status ?? "—"}</b>
                    </div>
                    {site.description ? (
                      <div style={{ marginTop: 8, fontSize: 12, opacity: 0.8 }}>
                        {site.description}
                      </div>
                    ) : null}
                    <a
                      href={getGoogleMapsDirectionsUrl(
                        {
                          lat: site.coordinates[0],
                          lng: site.coordinates[1],
                        },
                        userLocation
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-block",
                        marginTop: 12,
                        padding: "9px 14px",
                        borderRadius: 8,
                        background: "#0054A6",
                        color: "#fff",
                        fontWeight: 700,
                        fontSize: 13,
                        textDecoration: "none",
                        textAlign: "center",
                        width: "100%",
                        boxSizing: "border-box",
                      }}
                    >
                      Go
                    </a>
                    <p
                      style={{
                        marginTop: 8,
                        fontSize: 11,
                        lineHeight: 1.35,
                        opacity: 0.72,
                        color: "#334155",
                      }}
                    >
                      {userLocation
                        ? "Google Maps: from your current location to this pin."
                        : "Google Maps opens to this site. Allow location on this page to route from where you are."}
                    </p>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        <div className="pointer-events-none absolute left-4 top-4 z-[500] hidden sm:block">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 p-3 text-xs text-white/85 backdrop-blur">
            <div className="text-[11px] font-semibold tracking-wide text-white/80">
              Programs Legend
            </div>
            <div className="mt-2 grid gap-2">
              {PROGRAM_ORDER.map((key) => {
                const v = PROGRAM_STYLES[key];
                if (!v) return null;
                const n = mapCountsByProgram[key] ?? 0;
                return (
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
                    <span className="tabular-nums text-white/80">
                      {n} site{n === 1 ? "" : "s"} on map
                    </span>
                  </div>
                );
              })}
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
