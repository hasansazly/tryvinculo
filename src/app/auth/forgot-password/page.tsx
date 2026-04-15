import Link from 'next/link';

export default function ForgotPasswordPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>Forgot password</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
          Password reset is not yet active in this demo build.
        </p>
        <Link href="/auth/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>Back to sign in</Link>
      </div>
    </main>
  );
}

