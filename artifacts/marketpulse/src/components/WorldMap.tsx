import { useEffect, useRef, useState } from 'react';
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
  const [loaded, setLoaded] = useState(false);

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

    d3.json<Topology<Objects>>('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json').then((world) => {
      if (!world) return;

      const features = (topojson.feature(world, world.objects.countries) as GeoJSON.FeatureCollection).features;

      svg.selectAll<SVGPathElement, GeoJSON.Feature>('path')
        .data(features)
        .join('path')
        .attr('d', pathGen as never)
        .attr('fill', (d) => getCountryColor(+(d.id ?? 0)))
        .attr('stroke', '#1e2d3d')
        .attr('stroke-width', 0.5)
        .style('cursor', (d) => COUNTRY_DATA[+(d.id ?? 0)] ? 'pointer' : 'default')
        .on('mousemove', (event: MouseEvent, d) => {
          const id = +(d.id ?? 0);
          const cd = COUNTRY_DATA[id];
          if (!cd || !tooltipRef.current || !wrapRef.current) return;
          const col = cd.sig === 'BULL' ? '#00ff9c' : cd.sig === 'BEAR' ? '#ff4d4f' : '#f5c842';
          const rect = wrapRef.current.getBoundingClientRect();
          const x = event.clientX - rect.left + 12;
          const y = event.clientY - rect.top - 20;
          tooltipRef.current.style.display = 'block';
          tooltipRef.current.style.left = x + 'px';
          tooltipRef.current.style.top = y + 'px';
          tooltipRef.current.innerHTML = `<b style="color:${col}">${cd.name}</b><br>Signal: <span style="color:${col}">${cd.sig}</span> · Score: ${cd.score.toFixed(2)}<br>Sector: ${cd.sector}`;
        })
        .on('mouseleave', () => {
          if (tooltipRef.current) tooltipRef.current.style.display = 'none';
        })
        .on('click', (_event: MouseEvent, d) => {
          const id = +(d.id ?? 0);
          if (COUNTRY_DATA[id] && onCountryClick) onCountryClick(id);
        });

      if (!fullScreen) {
        const lg = svg.append('g').attr('transform', `translate(10,${h - 30})`);
        ([
          { c: '#008855', l: 'Bullish' },
          { c: '#cc2222', l: 'Bearish' },
          { c: '#665500', l: 'Neutral' },
          { c: '#1a2535', l: 'Low Data' },
        ] as const).forEach((item, i) => {
          lg.append('rect').attr('x', i * 72).attr('y', 0).attr('width', 10).attr('height', 10).attr('fill', item.c);
          lg.append('text').attr('x', i * 72 + 13).attr('y', 9).attr('fill', '#5a7a94').attr('font-size', '9').attr('font-family', 'IBM Plex Mono').text(item.l);
        });
      }

      setLoaded(true);
    }).catch(() => {
      svg.append('text').attr('x', w / 2).attr('y', h / 2).attr('text-anchor', 'middle').attr('fill', '#5a7a94').attr('font-size', '12').text('Map loading...');
    });
  }, [height, fullScreen, onCountryClick]);

  return (
    <div ref={wrapRef} style={{ width: '100%', height: fullScreen ? '100%' : height, position: 'relative', background: 'var(--bg3)', border: fullScreen ? 'none' : '1px solid var(--border)', overflow: 'hidden' }}>
      <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
      <div ref={tooltipRef} className="map-tooltip" style={{ display: 'none' }} />
      {!loaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--muted)' }}>
          Loading map data...
        </div>
      )}
    </div>
  );
}
