'use client';

import { useState, useEffect } from 'react';
import Globe from '@/components/Globe';
import PromptInterface from '@/components/PromptInterface';

export default function Home() {
  const [country1, setCountry1] = useState('');
  const [country2, setCountry2] = useState('');
  const [countries, setCountries] = useState({ features: [] });
  const [countryCoords, setCountryCoords] = useState([]);
  const [lineColor, setLineColor] = useState('rgba(255, 0, 0, 0.8)');

  useEffect(() => {
    // Fetch country polygons
    fetch('https://datahub.io/core/geo-countries/r/countries.geojson')
      .then(res => res.json())
      .then(data => {
        setCountries(data);
      });

    // Fetch country coordinates
    fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json')
      .then(res => res.json())
      .then(data => {
        const countryData = data.map((country: any) => ({
          name: country.name.common,
          lat: country.latlng[0],
          lng: country.latlng[1],
        }));
        setCountryCoords(countryData);
      });
  }, []);

  // Function to determine line color based on relationship type
  const getRelationshipColor = (relationship: string): string => {
    const rel = relationship.toLowerCase();

    if (rel.includes('war') || rel.includes('conflict') || rel.includes('hostile')) {
      return 'rgba(255, 0, 0, 0.8)'; // Red for conflict
    } else if (
      rel.includes('alliance') ||
      rel.includes('cooperation') ||
      rel.includes('partnership')
    ) {
      return 'rgba(0, 255, 0, 0.8)'; // Green for positive relations
    } else if (rel.includes('trade') || rel.includes('economic') || rel.includes('business')) {
      return 'rgba(255, 255, 0, 0.8)'; // Yellow for economic relations
    } else if (rel.includes('tension') || rel.includes('dispute') || rel.includes('sanctions')) {
      return 'rgba(255, 165, 0, 0.8)'; // Orange for tensions
    } else if (rel.includes('neutral') || rel.includes('diplomatic')) {
      return 'rgba(255, 255, 255, 0.8)'; // White for neutral/diplomatic
    } else {
      return 'rgba(0, 0, 255, 0.8)'; // Blue for unknown/general relations
    }
  };

  // Handle countries detected from prompt analysis
  const handleCountriesDetected = (
    detectedCountry1: string,
    detectedCountry2: string,
    relationship: string
  ) => {
    // Clear any previous state to prevent contamination
    setCountry1('');
    setCountry2('');

    // Update with new countries after clearing
    setTimeout(() => {
      setCountry1(detectedCountry1);
      setCountry2(detectedCountry2);

      // Set line color based on relationship
      const relationshipColor = getRelationshipColor(relationship);
      setLineColor(relationshipColor);

      console.log(
        `🤖 AI detected: ${detectedCountry1} ↔ ${detectedCountry2} (${relationship}) - Color: ${relationshipColor}`
      );
    }, 100);
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Globe Background */}
      <div
        className="absolute top-0 left-0 w-full h-full z-0"
        onDragStart={e => e.preventDefault()}
      >
        <Globe
          country1={country1}
          country2={country2}
          countries={countries}
          countryCoords={countryCoords}
          lineColor={lineColor}
        />
      </div>

      {/* Prompt Interface */}
      <PromptInterface onCountriesDetected={handleCountriesDetected} />
    </main>
  );
}
