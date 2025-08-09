'use client';

import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { useDebouncedCallback } from 'use-debounce';

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

  const getCountryCoords = (countryName: string) => {
    const country = countryCoords.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country ? { lat: country.lat, lng: country.lng, name: country.name } : null;
  };

  const country1Coords = getCountryCoords(country1);
  const country2Coords = getCountryCoords(country2);

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
    color: 'yellow',
  }));


  useEffect(() => {
    if (globeEl.current) {
      // @ts-ignore
      globeEl.current.pointOfView({ lat: 20, lng: 0, altitude: 2 });
    }
  }, []);

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
    />
  );
}