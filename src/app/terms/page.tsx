import Link from 'next/link';

export default function TermsPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Terms of Service</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
          By using Vinculo, you agree to use the service respectfully and lawfully.
        </p>
        <div style={{ display: 'grid', gap: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>
          <p>You are responsible for your account activity and for the content you share.</p>
          <p>Harassment, impersonation, and abusive behavior are not permitted and may lead to removal.</p>
          <p>Vinculo provides tools and guidance, but users remain responsible for personal decisions and interactions.</p>
        </div>
        <p style={{ marginTop: 28, fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>Last updated: April 15, 2026</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#a78bfa', textDecoration: 'none' }}>Back to home</Link>
      </div>
    </main>
  );
}

