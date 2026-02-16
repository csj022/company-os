import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithOAuth } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const provider = searchParams.get('provider') || 'github';

    if (code) {
      loginWithOAuth(provider, code)
        .then(() => navigate('/dashboard'))
        .catch(() => navigate('/login'));
    } else {
      navigate('/login');
    }
  }, [searchParams, loginWithOAuth, navigate]);

  return (
    <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0176D3] to-[#014F86] mb-4 animate-pulse">
          <span className="text-white font-bold text-2xl">CO</span>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Authenticating...</h2>
        <p className="text-slate-400">Please wait while we sign you in</p>
      </div>
    </div>
  );
}
