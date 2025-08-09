
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading Globe...</div>
});
import { useDebouncedCallback } from 'use-debounce';
import * as THREE from 'three';
import { useTooltipData } from '@/hooks/useTooltipData';

interface Country {
  properties: {
    ADMIN: string;
  };
}

interface CountryCoord {
    name: string;
    lat: number;
    lng: number;
}

interface GlobeProps {
  country1: string;
  country2: string;
  countries: {
    features: Country[];
  };
  countryCoords: CountryCoord[];
  lineColor: string;
}

export default function GlobeComponent({ country1, country2, countries, countryCoords, lineColor }: GlobeProps) {
  const globeEl = useRef<any>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { 
    isLoading, 
    fetchTooltipData, 
    getCountryTooltip, 
    getRelationshipTooltip 
  } = useTooltipData();

  const debouncedResize = useDebouncedCallback(() => {
    if (typeof window !== 'undefined') {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }
  }, 200);

  useEffect(() => {
    debouncedResize();
    window.addEventListener('resize', debouncedResize);
    return () => window.removeEventListener('resize', debouncedResize);
  }, [debouncedResize]);

  // Fetch tooltip data when both countries are provided
  useEffect(() => {
    if (country1 && country2) {
      fetchTooltipData(country1, country2);
    }
  }, [country1, country2, fetchTooltipData]);

  useEffect(() => {
    // Add stars
    const globe = globeEl.current;
    if (!globe) return;

    const scene = globe.scene();
    const starQty = 10000;
    const starGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    const radius = 1000;
    for (let i = 0; i < starQty; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = 2 * Math.PI * u;
      const phi = Math.acos(2 * v - 1);
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      transparent: true,
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
  }, []);

  const getCountryCoords = (countryName: string) => {
    const country = countryCoords.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country ? { lat: country.lat, lng: country.lng, name: country.name } : null;
  };

  const country1Coords = getCountryCoords(country1);
  const country2Coords = getCountryCoords(country2);

  // Function to render country tooltips
  const renderCountryTooltip = (country: Country) => {
    const countryName = country.properties.ADMIN;
    const tooltipData = getCountryTooltip(countryName);
    
    if (isLoading) {
      return `
        <div class="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-xs border border-gray-600 scene-tooltip">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-700 rounded w-full mb-1"></div>
            <div class="h-3 bg-gray-700 rounded w-5/6"></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">Loading current events...</p>
        </div>
      `;
    }
    
    if (tooltipData) {
      const lastUpdated = tooltipData.lastUpdated ? 
        new Date(tooltipData.lastUpdated).toLocaleDateString() : '';
      
      return `
        <div class="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-sm border border-gray-600 scene-tooltip">
          <div class="mb-2">
            <h3 class="text-lg font-bold text-blue-400">${tooltipData.country}</h3>
            ${lastUpdated ? `<p class="text-xs text-gray-400">Updated: ${lastUpdated}</p>` : ''}
          </div>
          <div class="mb-3">
            <p class="text-sm leading-relaxed">${tooltipData.paragraph}</p>
          </div>
          ${tooltipData.sources && tooltipData.sources.length > 0 ? `
            <div>
              <p class="text-xs text-gray-400 mb-1">Sources:</p>
              <div class="flex flex-wrap gap-1">
                ${tooltipData.sources.map(source => 
                  `<span class="text-xs bg-gray-700 px-2 py-1 rounded">${source}</span>`
                ).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    return `
      <div class="bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-sm border border-gray-600 scene-tooltip">
        <h3 class="text-lg font-bold text-blue-400 mb-2">🌍 ${countryName}</h3>
        <p class="text-sm text-gray-300 mb-2">
          Hover or click to analyze current developments and relationships with other countries.
        </p>
        <div class="text-xs text-gray-400 border-t border-gray-600 pt-2">
          <p>💡 Enter two countries above to get AI-powered analysis of their relationship and recent developments.</p>
        </div>
      </div>
    `;
  };

  // Function to render arc tooltips
  const renderArcTooltip = () => {
    const relationshipTooltip = getRelationshipTooltip();
    
    if (isLoading) {
      return `
        <div class="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-xs border border-gray-600 scene-tooltip">
          <div class="animate-pulse">
            <div class="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
            <div class="h-3 bg-gray-700 rounded w-full mb-1"></div>
            <div class="h-3 bg-gray-700 rounded w-5/6"></div>
          </div>
          <p class="text-xs text-gray-400 mt-2">Loading current events...</p>
        </div>
      `;
    }
    
    if (relationshipTooltip) {
      const lastUpdated = relationshipTooltip.lastUpdated ? 
        new Date(relationshipTooltip.lastUpdated).toLocaleDateString() : '';
      
      return `
        <div class="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md border border-gray-600 scene-tooltip">
          <div class="mb-2">
            <h3 class="text-lg font-bold text-purple-400">
              ${relationshipTooltip.country1} ↔ ${relationshipTooltip.country2}
            </h3>
            <p class="text-sm text-yellow-400 capitalize font-medium">
              Relationship: ${relationshipTooltip.relationship}
            </p>
            ${lastUpdated ? `<p class="text-xs text-gray-400">Updated: ${lastUpdated}</p>` : ''}
          </div>
          <div class="mb-3">
            <p class="text-sm leading-relaxed">${relationshipTooltip.paragraph}</p>
          </div>
          ${relationshipTooltip.sources && relationshipTooltip.sources.length > 0 ? `
            <div>
              <p class="text-xs text-gray-400 mb-1">Sources:</p>
              <div class="flex flex-wrap gap-1">
                ${relationshipTooltip.sources.map(source => 
                  `<span class="text-xs bg-gray-700 px-2 py-1 rounded">${source}</span>`
                ).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }
    
    return `
      <div class="bg-gray-800 text-white p-4 rounded-lg shadow-lg max-w-md border border-gray-600 scene-tooltip">
        <h3 class="text-lg font-bold text-purple-400 mb-2">🔗 ${country1} ↔ ${country2}</h3>
        <p class="text-sm text-gray-300 mb-2">
          Connection between these two countries. Click to load current relationship analysis.
        </p>
        <div class="text-xs text-gray-400 border-t border-gray-600 pt-2">
          <p>📊 AI will analyze recent developments, diplomatic relations, trade, and conflicts between these countries.</p>
        </div>
      </div>
    `;
  };

  useEffect(() => {
    if (globeEl.current && country1Coords && country2Coords) {
      // Calculate midpoint
      const lat1 = country1Coords.lat * Math.PI / 180;
      const lon1 = country1Coords.lng * Math.PI / 180;
      const lat2 = country2Coords.lat * Math.PI / 180;
      const lon2 = country2Coords.lng * Math.PI / 180;

      const Bx = Math.cos(lat2) * Math.cos(lon2 - lon1);
      const By = Math.cos(lat2) * Math.sin(lon2 - lon1);
      const lat3 = Math.atan2(Math.sin(lat1) + Math.sin(lat2), Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By));
      const lon3 = lon1 + Math.atan2(By, Math.cos(lat1) + Bx);

      const centerLat = lat3 * 180 / Math.PI;
      const centerLng = lon3 * 180 / Math.PI;

      // Calculate distance for zoom
      const R = 6371; // Radius of Earth in km
      const dLat = lat2 - lat1;
      const dLon = lon2 - lon1;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      const altitude = 2.5 - (distance / 20000); // Simple formula to adjust altitude based on distance

      globeEl.current.pointOfView({
        lat: centerLat,
        lng: centerLng,
        altitude: altitude < 0.1 ? 0.1 : altitude, // a minimum altitude
      }, 2000); // 2 second transition
    } else if (globeEl.current) {
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
    }
  }, [country1, country2, country1Coords, country2Coords]);

  const handleZoom = (pov: any) => {
    const { altitude } = pov;
    const minAltitude = 0.8; // Decreased from 0.1
    const maxAltitude = 4;

    if (altitude < minAltitude) {
        globeEl.current.pointOfView({ ...pov, altitude: minAltitude });
    } else if (altitude > maxAltitude) {
        globeEl.current.pointOfView({ ...pov, altitude: maxAltitude });
    }
  };

  const arcsData = country1Coords && country2Coords ? [{
    startLat: country1Coords.lat,
    startLng: country1Coords.lng,
    endLat: country2Coords.lat,
    endLng: country2Coords.lng,
    color: lineColor,
    stroke: 2,
    tooltip: renderArcTooltip(),
  }] : [];

  // Create enhanced labels with buffer zones for easier hovering
  const labelsData = [country1Coords, country2Coords].filter((coords): coords is CountryCoord => coords !== null).map(coords => ({
    lat: coords.lat,
    lng: coords.lng,
    text: coords.name,
    size: 2.2,
    color: 'rgba(255, 255, 255, 0.95)',
    tooltip: renderCountryTooltip({ properties: { ADMIN: coords.name } }),
    buffer: 5, // Larger buffer zone for easier hovering
    name: coords.name, // Store name for click handling
  }));

  // Handle label clicks to show detailed tooltip
  const handleLabelClick = (_label: unknown) => {
    if (country1 && country2) {
      fetchTooltipData(country1, country2);
    }
  };

  return (
    <Globe
      ref={globeEl}
      width={size.width}
      height={size.height}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      arcsData={arcsData}
      arcColor={'color'}
      arcStroke={'stroke'}
      arcLabel={'tooltip'}
      polygonsData={countries.features}
      polygonCapColor={() => 'rgba(0, 0, 0, 0)'}
      polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
      polygonLabel={(d: any) => renderCountryTooltip(d)}
      labelsData={labelsData}
      labelLat={(d: any) => d.lat}
      labelLng={(d: any) => d.lng}
      labelText={(d: any) => d.text}
      labelSize={(d: any) => d.size}
      labelColor={(d: any) => d.color}
      labelLabel={(d: any) => d.tooltip}
      labelResolution={4}
      labelsTransitionDuration={500}
      onLabelClick={handleLabelClick}
      onZoom={handleZoom}
    />
  );
}
