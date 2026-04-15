import type { Metadata } from 'next';
import './globals.css';
import ViewportFix from './ViewportFix';

export const metadata: Metadata = {
  title: {
    default: 'Vinculo — Intentional Dating with Clarity',
    template: '%s | Vinculo',
  },
  description:
    'Vinculo helps you understand why a match may fit before you invest your time or emotional energy. No endless swiping — just curated daily matches with clear compatibility context.',
  keywords: ['intentional dating', 'dating app', 'compatibility', 'meaningful connections', 'curated matches'],
  authors: [{ name: 'Vinculo' }],
  openGraph: {
    title: 'Vinculo — Intentional Dating with Clarity',
    description: 'Compatibility designed for real intent. Curated daily matches. Real connections.',
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
