
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
  const [isAIPopulated, setIsAIPopulated] = useState(false);

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
    } else if (rel.includes('alliance') || rel.includes('cooperation') || rel.includes('partnership')) {
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
  const handleCountriesDetected = (detectedCountry1: string, detectedCountry2: string, relationship: string) => {
    // Update countries in input fields (for debugging/dev purposes)
    setCountry1(detectedCountry1);
    setCountry2(detectedCountry2);
    
    // Set line color based on relationship
    const relationshipColor = getRelationshipColor(relationship);
    setLineColor(relationshipColor);
    
    // Mark as AI populated and clear after 3 seconds
    setIsAIPopulated(true);
    setTimeout(() => setIsAIPopulated(false), 3000);
    
    console.log(`🤖 AI detected: ${detectedCountry1} ↔ ${detectedCountry2} (${relationship}) - Color: ${relationshipColor}`);
  };

  // Handle manual input changes
  const handleManualCountry1Change = (value: string) => {
    setCountry1(value);
    setIsAIPopulated(false); // Clear AI indicator on manual change
  };

  const handleManualCountry2Change = (value: string) => {
    setCountry2(value);
    setIsAIPopulated(false); // Clear AI indicator on manual change
  };

  const colors = [
    { name: 'Conflict (Red)', value: 'rgba(255, 0, 0, 0.8)' },
    { name: 'Alliance (Green)', value: 'rgba(0, 255, 0, 0.8)' },
    { name: 'Economic (Yellow)', value: 'rgba(255, 255, 0, 0.8)' },
    { name: 'Tension (Orange)', value: 'rgba(255, 165, 0, 0.8)' },
    { name: 'Diplomatic (White)', value: 'rgba(255, 255, 255, 0.8)' },
    { name: 'General (Blue)', value: 'rgba(0, 0, 255, 0.8)' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Globe Background */}
      <div className="absolute top-0 left-0 w-full h-full z-0" onDragStart={(e) => e.preventDefault()}>
        <Globe
          country1={country1}
          country2={country2}
          countries={countries}
          countryCoords={countryCoords}
          lineColor={lineColor}
        />
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 z-40">
        <div className="flex gap-4 max-w-4xl mx-auto top-controls p-4">
          {/* AI Detection Indicator */}
          {isAIPopulated && (
            <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
              🤖 AI Detected
            </div>
          )}
          
          <div className="relative">
            <input
              type="text"
              placeholder="🌍 Country 1"
              value={country1}
              onChange={(e) => handleManualCountry1Change(e.target.value)}
              className={`px-3 py-2 enhanced-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isAIPopulated ? 'ring-2 ring-green-400 bg-green-900/20' : ''
              }`}
            />
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="🌍 Country 2"
              value={country2}
              onChange={(e) => handleManualCountry2Change(e.target.value)}
              className={`px-3 py-2 enhanced-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isAIPopulated ? 'ring-2 ring-green-400 bg-green-900/20' : ''
              }`}
            />
          </div>
          
          <select
            value={lineColor}
            onChange={(e) => setLineColor(e.target.value)}
            className={`px-3 py-2 enhanced-input rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isAIPopulated ? 'ring-2 ring-green-400 bg-green-900/20' : ''
            }`}
            title="Connection color represents relationship type"
          >
            {colors.map(color => (
              <option key={color.name} value={color.value} className="bg-gray-800">
                {color.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prompt Interface */}
      <PromptInterface onCountriesDetected={handleCountriesDetected} />
    </main>
  );
}
