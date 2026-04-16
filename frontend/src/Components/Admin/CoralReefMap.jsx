import { useEffect, useMemo } from "react";
import {
  MapContainer,
  LayerGroup,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

import { createProgramDivIcon, fixLeafletDefaultIcons } from "../Map/programMarkers";

const STATUS_STYLES = {
  Healthy: { label: "Healthy", color: "#22C55E" },
  "Bleached Damaged": { label: "Bleached Damaged", color: "#F59E0B" },
  Recovering: { label: "Recovering", color: "#38BDF8" },
  Dead: { label: "Dead", color: "#EF4444" },
};

function hasCoordinates(record) {
  return (
    record?.location?.latitude != null &&
    !Number.isNaN(Number(record.location.latitude)) &&
    record?.location?.longitude != null &&
    !Number.isNaN(Number(record.location.longitude))
  );
}

function normalizeAreaCoordinates(areaCoordinates) {
  if (!Array.isArray(areaCoordinates)) return [];
  return areaCoordinates
    .map((point) => {
      const lat = Number(point?.latitude);
      const lng = Number(point?.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return [lat, lng];
    })
    .filter(Boolean);
}

function MapClickPick({ onPick, active }) {
  useMapEvents({
    click(e) {
      if (!active || !onPick) return;
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const CoralReefMap = ({
  records = [],
  pickMode = false,
  onPickLocation,
  pickerPosition = null,
  className = "",
  splitLayout = false,
  drawMode = false,
  onToggleDrawMode,
  draftAreaCoordinates = [],
  onUndoLastPoint,
}) => {
  const center = useMemo(() => L.latLng(13.4463, 122.0837), []);

  const mappedRecords = useMemo(() => records.filter(hasCoordinates), [records]);
  const draftAreaLatLngs = useMemo(
    () => normalizeAreaCoordinates(draftAreaCoordinates),
    [draftAreaCoordinates]
  );

  const countsByStatus = useMemo(() => {
    const counts = {
      Healthy: 0,
      "Bleached Damaged": 0,
      Recovering: 0,
      Dead: 0,
    };
    for (const record of mappedRecords) {
      if (counts[record.coralStatus] != null) counts[record.coralStatus] += 1;
    }
    return counts;
  }, [mappedRecords]);

  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  const pickerIcon = useMemo(
    () =>
      createProgramDivIcon({
        label: "+",
        color: "#FDB913",
      }),
    []
  );

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur ${splitLayout ? "h-full min-h-0" : ""} ${pickMode ? "ring-2 ring-[#FDB913]/40" : ""} ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,.18),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(99,179,237,.30)_1px,transparent_1px),linear-gradient(to_bottom,rgba(99,179,237,.20)_1px,transparent_1px)] [background-size:48px_48px]" />

      <div className="relative flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="text-left">
          <div className="text-xs font-medium tracking-wide text-white/60">
            {pickMode ? "Set location" : "Admin map"}
          </div>
          <div className="mt-0.5 text-sm font-semibold text-white">
            {pickMode
              ? drawMode
                ? "Draw mode: click points to outline reef area"
                : "Click the map to place the coral reef pin"
              : "Marinduque — mapped coral reef records"}
          </div>
        </div>
        {pickMode ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleDrawMode}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                drawMode
                  ? "border-[#FDB913]/40 bg-[#FDB913]/20 text-[#fde28f]"
                  : "border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
              }`}
            >
              {drawMode ? "Drawing: ON" : "Draw area"}
            </button>
            <button
              type="button"
              onClick={onUndoLastPoint}
              disabled={draftAreaLatLngs.length === 0}
              className="rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              Undo point
            </button>
          </div>
        ) : (
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.65)]" />
            {mappedRecords.length} on map
          </div>
        )}
      </div>

      <div
        className={
          splitLayout
            ? "relative min-h-0 w-full flex-1 basis-0"
            : "relative h-[min(70vh,640px)] min-h-[420px] w-full"
        }
      >
        <MapContainer
          center={center}
          zoom={11}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom
          attributionControl={false}
          className={`z-0 h-full min-h-[280px] w-full ${pickMode ? "cursor-crosshair" : ""}`}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />
          <MapClickPick
            active={Boolean(pickMode && onPickLocation)}
            onPick={onPickLocation}
          />

          {mappedRecords.map((record) => {
            const style = STATUS_STYLES[record.coralStatus] ?? STATUS_STYLES.Recovering;
            const areaLatLngs = normalizeAreaCoordinates(record.areaCoordinates);
            return (
              <LayerGroup key={record.id}>
                {areaLatLngs.length >= 3 ? (
                  <Polygon
                    positions={areaLatLngs}
                    pathOptions={{
                      color: style.color,
                      weight: 2,
                      opacity: 0.95,
                      fillColor: style.color,
                      fillOpacity: 0.2,
                    }}
                  />
                ) : null}
                <Marker
                  key={record.id}
                  position={[record.location.latitude, record.location.longitude]}
                  icon={createProgramDivIcon({
                    label: style.label.slice(0, 1),
                    color: style.color,
                  })}
                >
                  <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                    <span style={{ fontWeight: 700 }}>{record.coralStatus}</span>{" "}
                    <span style={{ opacity: 0.85 }}>• {record.coralName}</span>
                  </Tooltip>
                  <Popup>
                    <div style={{ minWidth: 240, color: "#0f172a" }}>
                      <div style={{ fontWeight: 800 }}>{record.coralName}</div>
                      {record.photo ? (
                        <img
                          src={record.photo}
                          alt=""
                          style={{
                            width: "100%",
                            maxHeight: 140,
                            objectFit: "cover",
                            borderRadius: 8,
                            marginTop: 8,
                            display: "block",
                          }}
                        />
                      ) : null}
                      <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.5 }}>
                        <div>
                          Type: <b>{record.coralType}</b>
                        </div>
                        <div>
                          Status: <b>{record.coralStatus}</b>
                        </div>
                        <div>
                          Area points: <b>{areaLatLngs.length}</b>
                        </div>
                        {record.description ? (
                          <div style={{ marginTop: 8, fontSize: 12, opacity: 0.9 }}>
                            {record.description}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </LayerGroup>
            );
          })}

          {draftAreaLatLngs.length >= 3 ? (
            <Polygon
              positions={draftAreaLatLngs}
              pathOptions={{
                color: "#FDB913",
                weight: 2,
                dashArray: "6 5",
                opacity: 0.95,
                fillColor: "#FDB913",
                fillOpacity: draftAreaLatLngs.length >= 3 ? 0.18 : 0.04,
              }}
            />
          ) : null}

          {draftAreaLatLngs.map((point, idx) => (
            <Marker
              key={`draft-area-${idx}`}
              position={point}
              icon={createProgramDivIcon({
                label: String(idx + 1),
                color: "#FDB913",
              })}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                Draft point {idx + 1}
              </Tooltip>
            </Marker>
          ))}

          {pickerPosition &&
          typeof pickerPosition.lat === "number" &&
          !Number.isNaN(pickerPosition.lat) &&
          typeof pickerPosition.lng === "number" &&
          !Number.isNaN(pickerPosition.lng) ? (
            <Marker position={[pickerPosition.lat, pickerPosition.lng]} icon={pickerIcon}>
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                Draft location
              </Tooltip>
            </Marker>
          ) : null}
        </MapContainer>

        <div className="pointer-events-none absolute left-4 top-4 z-[500] hidden sm:block">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/55 p-3 text-xs text-white/85 backdrop-blur">
            <div className="text-[11px] font-semibold tracking-wide text-white/80">
              Coral status legend
            </div>
            <div className="mt-2 grid gap-2">
              {Object.entries(STATUS_STYLES).map(([status, cfg]) => (
                <div key={status} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                  <span className="font-semibold text-white/90">{cfg.label}</span>
                  <span className="text-white/50">•</span>
                  <span className="tabular-nums text-white/80">
                    {countsByStatus[status] ?? 0} on map
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 px-4 py-3 text-[11px] text-white/55 sm:px-6">
          <div className="truncate">Tiles © OpenStreetMap contributors • © CARTO</div>
          <div className="hidden sm:block">Zoom: 10-15</div>
        </div>
      </div>
    </div>
  );
};

export default CoralReefMap;
