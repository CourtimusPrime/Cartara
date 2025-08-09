
'use client';

import { useEffect, useRef } from 'react';
import Globe from 'react-globe.gl';

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

  const getCountryCoords = (countryName: string) => {
    const country = countryCoords.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    return country ? { lat: country.lat, lng: country.lng } : null;
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

  const highlightedCountries = [country1, country2].filter(Boolean).map(name => {
    const country = countries.features.find(c => c.properties.ADMIN.toLowerCase() === name.toLowerCase());
    return country ? country.properties.ADMIN : null;
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
      polygonsData={countries.features}
      polygonCapColor={({ properties }: any) => highlightedCountries.includes(properties.ADMIN) ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)'}
      polygonSideColor={() => 'rgba(0, 0, 0, 0)'}
      polygonLabel={({ properties }: any) => `<b>${properties.ADMIN}</b>`}
      polygonsTransitionDuration={300}
    />
  );
}
