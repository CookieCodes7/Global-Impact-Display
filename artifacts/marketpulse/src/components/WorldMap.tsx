import { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Topology, Objects } from 'topojson-specification';
import { COUNTRY_DATA, getCountryColor } from '../data';

interface WorldMapProps {
  height?: number;
  onCountryClick?: (id: number) => void;
  fullScreen?: boolean;
}

export default function WorldMap({ height = 220, onCountryClick, fullScreen = false }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const resetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition().duration(400)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  }, []);

  const zoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition().duration(250)
      .call(zoomRef.current.scaleBy, 1.5);
  }, []);

  const zoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition().duration(250)
      .call(zoomRef.current.scaleBy, 1 / 1.5);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !wrapRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = wrapRef.current.clientWidth || 960;
    const h = wrapRef.current.clientHeight || height;

    const scale = fullScreen ? (h / 500) * 153 : 153;
    const projection = d3.geoNaturalEarth1()
      .scale(scale)
      .translate([w / 2, h / 2]);
    const pathGen = d3.geoPath(projection);

    // Container group that zoom/pan transforms
    const g = svg.append('g').attr('class', 'map-g');

    // Set up zoom behaviour
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .translateExtent([[-(w * 0.5), -(h * 0.5)], [w * 1.5, h * 1.5]])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        g.attr('transform', event.transform.toString());
        setZoomLevel(+event.transform.k.toFixed(2));
        if (tooltipRef.current) tooltipRef.current.style.display = 'none';
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Disable double-click zoom (we handle click for country panel)
    svg.on('dblclick.zoom', null);

    // Cursor styling
    svg.style('cursor', 'grab')
      .on('mousedown.cursor', () => svg.style('cursor', 'grabbing'))
      .on('mouseup.cursor', () => svg.style('cursor', 'grab'));

    d3.json<Topology<Objects>>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world) => {
      if (!world) return;

      const features = (topojson.feature(world, world.objects.countries) as GeoJSON.FeatureCollection).features;

      g.selectAll<SVGPathElement, GeoJSON.Feature>('path')
        .data(features)
        .join('path')
        .attr('d', pathGen as never)
        .attr('fill', (d) => getCountryColor(+(d.id ?? 0)))
        .attr('stroke', '#1e2d3d')
        .attr('stroke-width', 0.5)
        .style('cursor', (d) => COUNTRY_DATA[+(d.id ?? 0)] ? 'pointer' : 'grab')
        .on('mousemove', (event: MouseEvent, d) => {
          const id = +(d.id ?? 0);
          const cd = COUNTRY_DATA[id];
          if (!cd || !tooltipRef.current || !wrapRef.current) return;
          const col = cd.sig === 'BULL' ? '#00ff9c' : cd.sig === 'BEAR' ? '#ff4d4f' : '#f5c842';
          const rect = wrapRef.current.getBoundingClientRect();
          let x = event.clientX - rect.left + 14;
          let y = event.clientY - rect.top - 12;
          // Keep tooltip inside bounds
          if (x + 180 > rect.width) x = event.clientX - rect.left - 190;
          if (y + 60 > rect.height) y = event.clientY - rect.top - 70;
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = x + 'px';
          tooltipRef.current.style.top = y + 'px';
          tooltipRef.current.innerHTML =
            `<b style="color:${col}">${cd.name}</b><br>Signal: <span style="color:${col}">${cd.sig}</span> · Score: ${cd.score.toFixed(2)}<br>Sector: ${cd.sector}`;
        })
        .on('mouseleave', () => {
          if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        })
        .on('click', (_event: MouseEvent, d) => {
          const id = +(d.id ?? 0);
          if (COUNTRY_DATA[id] && onCountryClick) onCountryClick(id);
        });

      // Legend
      if (!fullScreen) {
        const lg = g.append('g').attr('transform', `translate(8,${h - 28})`);
        ([
          { c: '#008855', l: 'Bullish' },
          { c: '#cc2222', l: 'Bearish' },
          { c: '#665500', l: 'Neutral' },
          { c: '#1a2535', l: 'No Data' },
        ] as const).forEach((item, i) => {
          lg.append('rect').attr('x', i * 70).attr('y', 0).attr('width', 9).attr('height', 9).attr('fill', item.c);
          lg.append('text').attr('x', i * 70 + 12).attr('y', 8).attr('fill', '#5a7a94').attr('font-size', '8').attr('font-family', 'IBM Plex Mono').text(item.l);
        });
      }

      setLoaded(true);
    }).catch(() => {
      g.append('text').attr('x', w / 2).attr('y', h / 2).attr('text-anchor', 'middle').attr('fill', '#5a7a94').attr('font-size', '12').text('Map loading...');
    });
  }, [height, fullScreen, onCountryClick]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: fullScreen ? '100%' : height, position: 'relative', background: 'var(--bg3)', border: fullScreen ? 'none' : '1px solid var(--border)', overflow: 'hidden' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      <div ref={tooltipRef} className="map-tooltip" style={{ display: 'none' }} />

      {/* Zoom controls */}
      {loaded && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <button onClick={zoomIn} title="Zoom in" style={zoomBtnStyle}>+</button>
          <button onClick={zoomOut} title="Zoom out" style={zoomBtnStyle}>−</button>
          <button onClick={resetZoom} title="Reset view" style={{ ...zoomBtnStyle, fontSize: 7, padding: '2px 3px' }}>RST</button>
          {zoomLevel > 1.05 && (
            <div style={{ fontSize: 7, color: 'var(--muted)', textAlign: 'center', fontFamily: 'var(--font)' }}>{zoomLevel.toFixed(1)}×</div>
          )}
        </div>
      )}

      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)' }}>
          Loading map data...
        </div>
      )}
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 20, height: 20,
  background: '#0a1520dd',
  border: '1px solid #1e2d3d',
  color: '#7fb3d3',
  fontFamily: 'IBM Plex Mono, monospace',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: 0,
  lineHeight: 1,
};
