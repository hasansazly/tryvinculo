import Link from 'next/link';

export default function SafetyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Safety</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
          Vinculo is built to support safer, more intentional dating.
        </p>
        <div style={{ display: 'grid', gap: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>
          <p>Use Trust Signals for context like verification status and profile consistency.</p>
          <p>Report and block tools are available in-app if something feels off.</p>
          <p>Always prioritize your judgment and meet in public for first dates.</p>
        </div>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#a78bfa', textDecoration: 'none' }}>Back to home</Link>
      </div>
    </main>
  );
}

