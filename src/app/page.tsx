'use client';

import { useState, useEffect } from 'react';
import Globe from '@/components/Globe';

export default function Home() {
  const [country1, setCountry1] = useState('');
  const [country2, setCountry2] = useState('');
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Fetch country data
    fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json')
      .then(res => res.json())
      .then(data => {
        const countryData = data.map((country: any) => ({
          name: country.name.common,
          lat: country.latlng[0],
          lng: country.latlng[1],
        }));
        setCountries(countryData);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Country Visualizer</h1>
      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Enter country 1"
          value={country1}
          onChange={(e) => setCountry1(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        />
        <input
          type="text"
          placeholder="Enter country 2"
          value={country2}
          onChange={(e) => setCountry2(e.target.value)}
          className="p-2 border border-gray-300 rounded-md"
        />
      </div>
      <div className="w-full h-[600px]">
        <Globe country1={country1} country2={country2} countries={countries} />
      </div>
    </main>
  );
}