
'use client';

import { useState, useEffect } from 'react';
import Globe from '@/components/Globe';
import Chat from '@/components/Chat';

export default function Home() {
  const [country1, setCountry1] = useState('');
  const [country2, setCountry2] = useState('');
  const [countries, setCountries] = useState({ features: [] });
  const [countryCoords, setCountryCoords] = useState([]);
  const [lineColor, setLineColor] = useState('rgba(255, 0, 0, 0.8)');
  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const colors = [
    { name: 'Red', value: 'rgba(255, 0, 0, 0.8)' },
    { name: 'Green', value: 'rgba(0, 255, 0, 0.8)' },
    { name: 'Blue', value: 'rgba(0, 0, 255, 0.8)' },
    { name: 'White', value: 'rgba(255, 255, 255, 0.8)' },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Globe and main content */}
      <div className={`transition-all duration-300 ${isChatOpen ? 'mr-96' : 'mr-0'}`}>
        <div className="absolute top-0 left-0 w-full h-full z-0" onDragStart={(e) => e.preventDefault()}>
          <Globe
            country1={country1}
            country2={country2}
            countries={countries}
            countryCoords={countryCoords}
            lineColor={lineColor}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold mb-8 text-white">Country Visualizer</h1>
          <div className="flex gap-4 mb-8">
            <input
              type="text"
              placeholder="Enter country 1"
              value={country1}
              onChange={(e) => setCountry1(e.target.value)}
              className="p-2 border border-gray-300 rounded-md bg-gray-800 text-white"
            />
            <input
              type="text"
              placeholder="Enter country 2"
              value={country2}
              onChange={(e) => setCountry2(e.target.value)}
              className="p-2 border border-gray-300 rounded-md bg-gray-800 text-white"
            />
            <select
              value={lineColor}
              onChange={(e) => setLineColor(e.target.value)}
              className="p-2 border border-gray-300 rounded-md bg-gray-800 text-white"
            >
              {colors.map(color => (
                <option key={color.name} value={color.value}>
                  {color.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg ${
          isChatOpen ? 'right-[25rem]' : 'right-4'
        }`}
        aria-label="Toggle AI Chat"
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.456L3 21l2.456-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        )}
      </button>

      {/* Chat Sidebar */}
      <Chat isOpen={isChatOpen} onToggle={setIsChatOpen} />
    </main>
  );
}
