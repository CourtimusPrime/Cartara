
'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

const Globe = dynamic(() => import('react-globe.gl'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">Loading Globe...</div>
});
import { useDebouncedCallback } from 'use-debounce';
import * as THREE from 'three';

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
  const globeEl = useRef();
  const [size, setSize] = useState({ width: 0, height: 0 });

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

  useEffect(() => {
    // Add stars
    const globe = globeEl.current;
    if (!globe) return;

    // @ts-ignore
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

      // @ts-ignore
      globeEl.current.pointOfView({
        lat: centerLat,
        lng: centerLng,
        altitude: altitude < 0.1 ? 0.1 : altitude, // a minimum altitude
      }, 2000); // 2 second transition
    } else if (globeEl.current) {
        // @ts-ignore
        globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2 }, 2000);
    }
  }, [country1, country2, country1Coords, country2Coords]);

  const handleZoom = (pov) => {
    const { altitude } = pov;
    const minAltitude = 0.8; // Decreased from 0.1
    const maxAltitude = 4;

    if (altitude < minAltitude) {
        // @ts-ignore
      globeEl.current.pointOfView({ ...pov, altitude: minAltitude });
    } else if (altitude > maxAltitude) {
        // @ts-ignore
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
  }] : [];

  const labelsData = [country1Coords, country2Coords].filter(Boolean).map(coords => ({
    lat: coords.lat,
    lng: coords.lng,
    text: coords.name,
    size: 1.5,
    color: 'white',
  }));

  return (
    <Globe
      // @ts-ignore
      ref={globeEl}
      width={size.width}
      height={size.height}
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      arcsData={arcsData}
      arcColor={'color'}
      arcStroke={'stroke'}
      polygonsData={countries.features}
      polygonCapColor={() => 'rgba(0, 0, 0, 0)'}
      polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
      polygonLabel={({ properties }: any) => `<b>${properties.ADMIN}</b>`}
      labelsData={labelsData}
      labelLat={d => d.lat}
      labelLng={d => d.lng}
      labelText={d => d.text}
      labelSize={d => d.size}
      labelColor={d => d.color}
      labelTransitionDuration={500}
      onZoom={handleZoom}
    />
  );
}
