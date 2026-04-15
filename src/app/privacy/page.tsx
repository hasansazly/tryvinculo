import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', padding: '64px 24px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 14 }}>Privacy Policy</h1>
        <p style={{ fontSize: 15, color: 'rgba(240,240,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>
          Vinculo is designed to protect your data and keep control in your hands.
        </p>
        <div style={{ display: 'grid', gap: 14, color: 'rgba(240,240,255,0.7)', lineHeight: 1.7 }}>
          <p>We collect profile and usage data to improve matching clarity, trust signals, and core app functionality.</p>
          <p>We do not sell your personal data. You can request deletion and control key privacy settings from your account.</p>
          <p>Verification and safety features are intended to add context, not guarantee outcomes.</p>
        </div>
        <p style={{ marginTop: 28, fontSize: 13, color: 'rgba(240,240,255,0.4)' }}>Last updated: April 15, 2026</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 24, color: '#a78bfa', textDecoration: 'none' }}>Back to home</Link>
      </div>
    </main>
  );
}
