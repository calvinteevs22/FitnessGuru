const PAGE_STYLE = {
  minHeight: '100vh', background: '#0d1a0e', display: 'flex',
  flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  padding: '40px 24px',
}

const CARD_STYLE = (accent) => ({
  background: 'rgba(255,255,255,0.04)', border: `1px solid ${accent}33`,
  borderRadius: 16, padding: '40px 36px', flex: 1, maxWidth: 380,
  display: 'flex', flexDirection: 'column', gap: 16,
  transition: 'border-color 0.2s',
})

const CTA_BTN = (bg, color) => ({
  display: 'block', textAlign: 'center', textDecoration: 'none',
  fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  background: bg, color, border: 'none', borderRadius: 8,
  padding: '14px 24px', cursor: 'pointer', marginTop: 'auto',
})

export default function SignupEntryPage() {
  return (
    <div style={PAGE_STYLE}>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#4ade80', margin: '0 0 12px' }}>
          FitnessGuru
        </p>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontWeight: 900, textTransform: 'uppercase', fontSize: 'clamp(28px, 4vw, 48px)', color: '#EEF2EE', margin: 0, lineHeight: 1 }}>
          Get started
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 20, width: '100%', maxWidth: 780, flexWrap: 'wrap' }}>
        {/* Client card */}
        <div style={CARD_STYLE('#4ade80')}>
          <div style={{ fontSize: 36 }}>🏃</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#EEF2EE', margin: 0 }}>
            I'm looking for a trainer
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.6)', margin: 0, lineHeight: 1.6 }}>
            Create a free account and find your perfect match.
          </p>
          <a href="/signup/client" style={CTA_BTN('#4ade80', '#0d1a0e')}>
            Get started
          </a>
        </div>

        {/* Trainer card */}
        <div style={CARD_STYLE('#fbbf24')}>
          <div style={{ fontSize: 36 }}>💪</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 22, color: '#EEF2EE', margin: 0 }}>
            I'm a trainer
          </h2>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: 'rgba(238,242,238,0.6)', margin: 0, lineHeight: 1.6 }}>
            List your profile and grow your client base.
          </p>
          <a href="/signup/trainer" style={CTA_BTN('#fbbf24', '#100e06')}>
            Apply as trainer
          </a>
        </div>
      </div>

      <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'rgba(238,242,238,0.4)', marginTop: 32 }}>
        Already have an account?{' '}
        <a href="/login" style={{ color: '#4ade80', textDecoration: 'none' }}>Log in</a>
      </p>

      <style>{`
        @media (max-width: 600px) {
          div[style*="maxWidth: 780"] { flex-direction: column; }
        }
      `}</style>
    </div>
  )
}
