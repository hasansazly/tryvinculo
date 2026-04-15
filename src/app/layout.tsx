import type { Metadata } from 'next';
import './globals.css';
import ViewportFix from './ViewportFix';

export const metadata: Metadata = {
  title: {
    default: 'Vinculo — AI Dating for Real Connections',
    template: '%s | Vinculo',
  },
  description:
    'Vinculo uses deep AI analysis to match you with people who genuinely complement your personality, values, and life goals. No endless swiping — just curated daily matches with transparent compatibility explanations.',
  keywords: ['AI dating', 'dating app', 'compatibility', 'meaningful connections', 'AI matchmaking'],
  authors: [{ name: 'Vinculo' }],
  openGraph: {
    title: 'Vinculo — AI Dating for Real Connections',
    description: 'Deep AI compatibility. Curated daily matches. Real connections.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>
        <ViewportFix />
        {children}
      </body>
    </html>
  );
}
