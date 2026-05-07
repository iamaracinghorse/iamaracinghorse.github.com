import { useState, useEffect } from 'react';

const EMBEDDED_TOKEN: string | undefined = import.meta.env.VITE_MUSICKIT_TOKEN;

interface SetupScreenProps {
  isConfigured: boolean;
  isAuthorized: boolean;
  isLoading: boolean;
  error: string | null;
  onConfigure: (token: string) => void;
  onAuthorize: () => void;
}

export function SetupScreen({
  isConfigured,
  isAuthorized,
  isLoading,
  error,
  onConfigure,
  onAuthorize,
}: SetupScreenProps) {
  const [token, setToken] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // If a token is embedded in the build, auto-configure on mount
  useEffect(() => {
    if (EMBEDDED_TOKEN && !isConfigured) {
      onConfigure(EMBEDDED_TOKEN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-12">
      {/* Title */}
      <div className="text-center mb-10">
        <div className="text-5xl mb-4">🔮</div>
        <h1
          className="text-2xl sm:text-3xl font-black text-fantasy-gold leading-tight mb-2"
          style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: '0 0 30px rgba(201,162,39,0.4)' }}
        >
          Boddydock's
          <br />
          Magical Music Box
        </h1>
        <p className="text-fantasy-text-muted text-sm mt-3" style={{ fontFamily: "'Cinzel', serif" }}>
          Thy Collection of Sonic Enchantments
        </p>
      </div>

      {/* Setup card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 border border-fantasy-border-gold"
        style={{
          background: 'linear-gradient(145deg, #2d1a0e, #1e120a)',
          boxShadow: '0 0 40px rgba(201,162,39,0.1), inset 0 1px 0 rgba(201,162,39,0.08)',
        }}
      >
        {!isConfigured ? (
          <>
            <h2 className="text-fantasy-gold text-base font-bold mb-1 text-center tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              Attune the Artifact
            </h2>
            <p className="text-fantasy-text-muted text-xs text-center mb-5 leading-relaxed">
              Enter your Apple MusicKit Developer Token to awaken the box.
            </p>

            <textarea
              className="input-fantasy text-xs mb-4 resize-none h-24"
              placeholder="Paste your MusicKit Developer Token (JWT)…"
              value={token}
              onChange={e => setToken(e.target.value)}
              spellCheck={false}
            />

            {error && (
              <p className="text-red-400 text-xs mb-4 text-center">{error}</p>
            )}

            <button
              className="btn-fantasy w-full mb-4"
              disabled={!token.trim() || isLoading}
              onClick={() => onConfigure(token.trim())}
            >
              {isLoading ? '⏳ Attuning…' : '✦ Attune'}
            </button>

            <button
              className="w-full text-fantasy-text-dim text-xs underline underline-offset-2 hover:text-fantasy-text-muted transition-colors"
              onClick={() => setShowHelp(v => !v)}
            >
              {showHelp ? 'Hide instructions' : 'How do I get a token?'}
            </button>

            {showHelp && (
              <div className="mt-4 text-fantasy-text-muted text-xs leading-relaxed space-y-2 border-t border-fantasy-border pt-4">
                <p>1. Sign in at <span className="text-fantasy-gold">developer.apple.com</span></p>
                <p>2. Create a MusicKit identifier under <em>Certificates, IDs &amp; Profiles → Identifiers</em></p>
                <p>3. Create a private key with MusicKit enabled</p>
                <p>4. Use a JWT library to sign a token with your Team ID, Key ID, and private key (exp: 6 months)</p>
                <p>5. Paste the resulting JWT above</p>
                <p className="text-fantasy-text-dim pt-1">Your token is stored locally and never sent anywhere except Apple's servers.</p>
              </div>
            )}
          </>
        ) : !isAuthorized ? (
          <>
            <h2 className="text-fantasy-gold text-base font-bold mb-1 text-center tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>
              Open the Gates
            </h2>
            <p className="text-fantasy-text-muted text-xs text-center mb-5 leading-relaxed">
              Sign in with your Apple ID to access thy Apple Music library.
            </p>
            {error && (
              <p className="text-red-400 text-xs mb-4 text-center">{error}</p>
            )}
            <button
              className="btn-fantasy w-full"
              disabled={isLoading}
              onClick={onAuthorize}
            >
              {isLoading ? '⏳ Opening…' : '🍎 Sign In with Apple Music'}
            </button>
          </>
        ) : (
          <div className="text-center">
            <div className="text-4xl mb-3">✨</div>
            <p className="text-fantasy-gold font-bold">The box awakens!</p>
            <p className="text-fantasy-text-muted text-xs mt-2">Loading your collection…</p>
          </div>
        )}
      </div>
    </div>
  );
}
