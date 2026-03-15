import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cartara',
  description: 'Map-based visualizer of news and current events',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
