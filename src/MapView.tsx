import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import type { DisguiseArea, MapMeta, MapNode } from './types';

interface Props {
  meta: MapMeta;
  floor: number;
  nodes: MapNode[];
  areas: DisguiseArea[];
  highlight: Set<number>;
  focus: MapNode | null;
  rarity: Record<string, string>;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const icons = new Map<string, L.Icon>();
function iconFor(name: string, highlighted: boolean) {
  const key = `${name}:${highlighted}`;
  if (!icons.has(key)) {
    const size = highlighted ? 34 : 26;
    icons.set(key, L.icon({
      iconUrl: `icons/${name}.png`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2],
      className: highlighted ? 'marker highlighted' : 'marker',
    }));
  }
  return icons.get(key)!;
}

function popupHtml(n: MapNode, rarity: Record<string, string>) {
  const tags = [n.group];
  if (rarity[n.name]) tags.push(`${rarity[n.name]} · keep in hideout`);
  if (n.standard && !n.alerted) tags.push('Standard only');
  if (!n.standard && n.alerted) tags.push('Alerted only');
  const qty = n.quantity > 1 ? ` <span class="pop-qty">×${n.quantity}</span>` : '';
  return `<div class="pop">
    <div class="pop-title">${esc(n.name || n.group)}${qty}</div>
    <div class="pop-tags">${tags.map((t) => `<span>${esc(t)}</span>`).join('')}</div>
    ${n.target ? `<div class="pop-action">${esc(n.target)}</div>` : ''}
    ${n.notes.map((x) => `<p class="note note-${esc(x.type)}">${esc(x.text)}</p>`).join('')}
  </div>`;
}

export function MapView({ meta, floor, nodes, areas, highlight, focus, rarity }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const overlay = useRef<L.SVGOverlay | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const areaLayer = useRef<L.LayerGroup | null>(null);
  const markerById = useRef(new Map<number, L.Marker>());

  useEffect(() => {
    const m = L.map(el.current!, {
      crs: L.CRS.Simple,
      minZoom: meta.minZoom,
      maxZoom: meta.maxZoom + 2,
      zoomSnap: 0.5,
      maxBounds: L.latLngBounds(meta.viewBounds).pad(0.15),
      maxBoundsViscosity: 0.8,
      attributionControl: false,
      zoomControl: false,
    }).setView(meta.center, meta.minZoom);
    L.control.zoom({ position: 'bottomright' }).addTo(m);
    m.createPane('floor').style.zIndex = '150';
    areaLayer.current = L.layerGroup().addTo(m);
    markerLayer.current = L.layerGroup().addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = overlay.current = markerLayer.current = areaLayer.current = null;
    };
  }, [meta]);

  // Floors are embedded as inline SVG (not <img>) so the browser redraws them as vectors at every zoom level.
  useEffect(() => {
    let cancelled = false;
    fetch(`maps/${meta.mapFolder}/${floor}.svg`)
      .then((res) => res.text())
      .then((text) => {
        if (cancelled || !map.current) return;
        const svg = new DOMParser().parseFromString(text, 'image/svg+xml').documentElement as unknown as SVGSVGElement;
        const w = parseFloat(svg.getAttribute('width') ?? '');
        const h = parseFloat(svg.getAttribute('height') ?? '');
        svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svg.setAttribute('preserveAspectRatio', 'none');
        overlay.current?.remove();
        overlay.current = L.svgOverlay(svg, meta.imageBounds, { pane: 'floor', interactive: false }).addTo(map.current);
      });
    return () => {
      cancelled = true;
    };
  }, [meta, floor]);

  useEffect(() => {
    markerLayer.current!.clearLayers();
    markerById.current.clear();
    for (const n of nodes) {
      if (n.level !== floor) continue;
      const marker = L.marker([n.lat, n.lng], {
        icon: iconFor(n.icon, highlight.has(n.id)),
        title: n.name || n.group,
        riseOnHover: true,
        zIndexOffset: highlight.has(n.id) ? 1000 : 0,
      }).bindPopup(popupHtml(n, rarity), { maxWidth: 300 });
      marker.addTo(markerLayer.current!);
      markerById.current.set(n.id, marker);
    }
  }, [meta, floor, nodes, highlight, rarity]);

  useEffect(() => {
    areaLayer.current!.clearLayers();
    for (const a of areas) {
      if (a.level !== floor || a.vertices.length < 3) continue;
      const hostile = a.type === 'hostile';
      L.polygon(a.vertices, {
        color: hostile ? '#ff3b3b' : '#f5c518',
        weight: 1,
        fillOpacity: 0.35,
        interactive: true,
      })
        .bindTooltip(hostile ? 'Hostile area' : 'Trespassing', { sticky: true })
        .addTo(areaLayer.current!);
    }
  }, [floor, areas]);

  useEffect(() => {
    if (!focus || focus.level !== floor) return;
    map.current!.flyTo([focus.lat, focus.lng], meta.maxZoom, { duration: 0.6 });
    markerById.current.get(focus.id)?.openPopup();
  }, [focus, floor, meta]);

  return <div ref={el} className="map" />;
}
