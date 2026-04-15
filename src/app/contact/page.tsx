import Link from 'next/link';

export default function ContactPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Contact</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7, marginBottom: 12 }}>
          Need help or want to report an issue? Reach us at:
        </p>
        <p style={{ fontSize: 16, fontWeight: 600 }}>
          <a href="mailto:support@tryvinculo.app" style={{ color: '#a78bfa', textDecoration: 'none' }}>support@tryvinculo.app</a>
        </p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#a78bfa', textDecoration: 'none' }}>Back to home</Link>
      </div>
    </main>
  );
}

