import Link from 'next/link';

const policyProvider = (process.env.NEXT_PUBLIC_POLICY_PROVIDER ?? '').toLowerCase();
const managedPolicyUrl =
  policyProvider === 'termly'
    ? process.env.NEXT_PUBLIC_TERMLY_PRIVACY_URL
    : policyProvider === 'iubenda'
      ? process.env.NEXT_PUBLIC_IUBENDA_PRIVACY_URL
      : process.env.NEXT_PUBLIC_PRIVACY_POLICY_URL;

const lastUpdated = process.env.NEXT_PUBLIC_PRIVACY_LAST_UPDATED ?? 'April 15, 2026';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2 style={{ marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'grid', gap: 10, color: '#2C2C2A', lineHeight: 1.75, fontSize: 15 }}>{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/auth/login" style={{ fontSize: 14, textDecoration: 'none', color: '#1A1A2E' }}>Sign in</Link>
            <Link href="/auth/signup" className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section style={{ flex: 1, padding: '3rem 1.5rem' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ marginBottom: 10 }}>Privacy Policy</h1>
          <p style={{ fontSize: 15, color: '#2C2C2A', lineHeight: 1.75, marginBottom: 10 }}>
            Vinculo is built for intentional dating with clear privacy controls. This page explains what we collect, why we collect it, and how you can control it.
          </p>
          <p style={{ fontSize: 13, color: '#5F5E5A', marginBottom: 24 }}>Last updated: {lastUpdated}</p>

          {managedPolicyUrl && (
            <div style={{ background: '#EEEDFE', border: '1px solid #CECBF6', borderRadius: 16, padding: '12px 14px', marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: '#2C2C2A', lineHeight: 1.7 }}>
                This policy is managed via {policyProvider === 'termly' ? 'Termly' : policyProvider === 'iubenda' ? 'iubenda' : 'our policy provider'}.
                {' '}
                <a href={managedPolicyUrl} target="_blank" rel="noreferrer" style={{ color: '#534AB7', textDecoration: 'none', fontWeight: 600 }}>
                  View the hosted policy
                </a>
                .
              </p>
            </div>
          )}

          <Section title="1. Information We Collect">
            <p>Account information: name, email, age, profile details, photos, and onboarding responses.</p>
            <p>Usage information: actions you take in the app (likes, passes, messages, settings, and feature interactions).</p>
            <p>Device and technical information: IP address, browser type, and diagnostics used for reliability and security.</p>
          </Section>

          <Section title="2. Why We Use Your Information">
            <p>To provide and improve matching clarity, conversation support, trust features, and app performance.</p>
            <p>To detect abuse, enforce platform rules, and support moderation and safety workflows.</p>
            <p>To communicate important service updates, security notices, and support responses.</p>
          </Section>

          <Section title="3. Trust Signals and Safety Context">
            <p>Trust Signals may include verification status, profile completeness, and behavioral consistency cues.</p>
            <p>These signals are intended to provide context for better decisions; they are not guarantees about any person or outcome.</p>
            <p>You can use reporting and blocking tools at any time if an interaction feels unsafe or inappropriate.</p>
          </Section>

          <Section title="4. Legal Bases and Consent">
            <p>Where required, we process data based on consent, contractual necessity, legitimate interests, and legal obligations.</p>
            <p>You may withdraw consent for optional processing where applicable through your settings or by contacting support.</p>
          </Section>

          <Section title="5. Sharing and Third Parties">
            <p>We do not sell your personal data.</p>
            <p>We may share limited data with service providers that help us operate the product (hosting, analytics, infrastructure, and communications).</p>
            <p>We may disclose information when required by law or to protect users, platform integrity, or legal rights.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We keep data only as long as needed for product functionality, security, legal compliance, and legitimate business purposes.</p>
            <p>When data is no longer needed, we delete it or anonymize it.</p>
          </Section>

          <Section title="7. Your Privacy Controls">
            <p>You can update profile details, manage certain visibility preferences, and use safety controls directly in the app.</p>
            <p>You may request account deletion and data access by contacting support.</p>
            <p>Where applicable, you may also object to specific processing or request correction of inaccurate information.</p>
          </Section>

          <Section title="8. International Transfers">
            <p>If data is processed across regions, we apply appropriate safeguards under applicable privacy laws.</p>
          </Section>

          <Section title="9. Children">
            <p>Vinculo is intended for adults only. We do not knowingly collect personal information from individuals under 18.</p>
          </Section>

          <Section title="10. Contact">
            <p>
              For privacy questions, data requests, or concerns, contact us at{' '}
              <a href="mailto:privacy@tryvinculo.app" style={{ color: '#534AB7', textDecoration: 'none', fontWeight: 600 }}>
                privacy@tryvinculo.app
              </a>
              .
            </p>
          </Section>

          <div style={{ marginTop: 26, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/" className="btn-ghost" style={{ padding: '10px 20px' }}>Back to home</Link>
            <Link href="/terms" className="btn-ghost" style={{ padding: '10px 20px' }}>View Terms</Link>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: '1px solid #2E2A49', padding: '36px 24px', background: '#1A1A2E' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <span style={{ color: '#CECBF6', fontSize: 13 }}>© 2026 Vinculo</span>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Link href="/privacy" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Privacy</Link>
            <Link href="/terms" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Terms</Link>
            <Link href="/" style={{ color: '#CECBF6', textDecoration: 'none', fontSize: 13 }}>Home</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
