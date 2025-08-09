
'use client';

import { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

interface Country {
  name: string;
  lat: number;
  lng: number;
}

interface GlobeProps {
  country1: string;
  country2: string;
  countries: Country[];
}

export default function GlobeComponent({ country1, country2, countries }: GlobeProps) {
  const globeEl = useRef();

  const getCountryCoords = (countryName: string) => {
    const country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country ? { lat: country.lat, lng: country.lng } : null;
  };

  const country1Coords = getCountryCoords(country1);
  const country2Coords = getCountryCoords(country2);

  const arcsData = country1Coords && country2Coords ? [{
    startLat: country1Coords.lat,
    startLng: country1Coords.lng,
    endLat: country2Coords.lat,
    endLng: country2Coords.lng,
    color: 'rgba(255, 0, 0, 0.8)',
    stroke: 2,
  }] : [];

  const highlightedCountries = [country1, country2].filter(Boolean).map(name => {
    const country = countries.find(c => c.name.toLowerCase() === name.toLowerCase());
    return country ? country.name : null;
  }).filter(Boolean);


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
      globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
      arcsData={arcsData}
      arcColor={'color'}
      arcStroke={'stroke'}
      polygonsData={countries}
      polygonCapColor={({ properties }: any) => highlightedCountries.includes(properties.name) ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
      polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
      polygonLabel={({ properties }: any) => `<b>${properties.name}</b>`}
      polygonsTransitionDuration={300}
    />
  );
}
