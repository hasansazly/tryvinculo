import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main className="contrast-safe light-page" style={{ minHeight: '100vh', background: '#FDF0F5', color: '#1A1A2E', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ borderBottom: '1px solid #F4C0D1', background: 'rgba(253,240,245,0.85)', backdropFilter: 'blur(12px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #D4537E, #7F77DD)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 16, lineHeight: 1 }}>♥</span>
            </div>
            <span style={{ fontWeight: 500, fontSize: 24, letterSpacing: '-0.02em', fontFamily: "'Playfair Display', Georgia, serif", color: '#1A1A2E' }}>vinculo</span>
          </Link>
          <Link href="/auth/login" className="btn-ghost" style={{ padding: '10px 22px', fontSize: 14 }}>
            Back to sign in
          </Link>
        </div>
      </nav>

      <section style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div style={{ width: '100%', maxWidth: 420, borderRadius: 20, padding: '2rem', background: '#FFFFFF', border: '1px solid #F4C0D1' }}>
          <h1 style={{ marginBottom: 10 }}>Forgot password</h1>
          <p style={{ fontSize: 15, color: '#2C2C2A', lineHeight: 1.7, marginBottom: 20 }}>
          Password reset is not yet active in this demo build.
          </p>
          <Link href="/auth/login" className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
            Back to sign in
          </Link>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #2E2A49', padding: '36px 24px', background: '#1A1A2E' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ color: '#CECBF6', fontSize: 13 }}>© 2026 Vinculo</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Privacy</Link>
            <Link href="/terms" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Terms</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
