"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import { AREA_COORDS, HUB } from "@/lib/geo";

// Map of a trip: green ring for pickup, amber square for drop-off, the
// Ikorodu hub as a small dot. Uses free OpenStreetMap tiles.
export default function TripMap({ from, to, height = 220 }: { from: string; to: string; height?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!box.current || map.current) return;
    map.current = L.map(box.current, { zoomControl: false, attributionControl: true, scrollWheelZoom: false }).setView(HUB, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: "© OpenStreetMap",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const a = AREA_COORDS[from];
    const b = AREA_COORDS[to];
    if (!map.current || !layer.current || !a || !b) return;
    layer.current.clearLayers();
    L.circleMarker(HUB, { radius: 4, color: "#0f4a35", fillOpacity: 1 }).bindTooltip("Ikorodu hub").addTo(layer.current);
    L.polyline([a, b], { color: "#0f4a35", weight: 4, dashArray: "8 8" }).addTo(layer.current);
    L.circleMarker(a, { radius: 9, color: "#0f4a35", weight: 4, fillColor: "#fff", fillOpacity: 1 })
      .bindTooltip(`Pickup: ${from}`, { permanent: true, direction: "top", offset: [0, -8] }).addTo(layer.current);
    L.marker(b, {
      icon: L.divIcon({ className: "", html: '<div style="width:16px;height:16px;border-radius:4px;background:#f2a900;border:2px solid #1b1400"></div>', iconSize: [16, 16] }),
    }).bindTooltip(`Drop-off: ${to}`, { permanent: true, direction: "bottom", offset: [0, 8] }).addTo(layer.current);
    const m = map.current;
    // Wait a frame so the map knows its real size before framing the trip.
    const frame = requestAnimationFrame(() => {
      m.invalidateSize();
      if (from === to) m.setView(a, 13);
      else m.fitBounds(L.latLngBounds([a, b]), { padding: [40, 40] });
    });
    return () => cancelAnimationFrame(frame);
  }, [from, to]);

  return <div ref={box} style={{ height }} className="z-0 w-full overflow-hidden rounded-2xl border border-[var(--line)]" role="img" aria-label={`Map from ${from} to ${to}`} />;
}
