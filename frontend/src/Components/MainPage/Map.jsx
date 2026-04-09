import { useEffect, useMemo } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

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
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
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
