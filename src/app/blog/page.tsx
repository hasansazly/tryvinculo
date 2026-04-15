import Link from 'next/link';

export default function BlogPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Blog</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7 }}>
          Articles on intentional dating, clearer communication, and building stronger connections are coming soon.
        </p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#a78bfa', textDecoration: 'none' }}>Back to home</Link>
      </div>
    </main>
  );
}

