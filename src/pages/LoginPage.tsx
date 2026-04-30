import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';
import { Sparkles, Shield, Zap } from 'lucide-react';

export default function LoginPage() {
  const { loginWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        {/* Glow effect background */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-jtweet-cyan/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/5 blur-[100px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-8 rounded-[40px] relative z-10 text-center border-white/5"
        >
          <div className="flex justify-center mb-8">
            <Logo size="lg" />
          </div>

          <h2 className="text-3xl font-display font-bold text-white mb-2 tracking-tight">
            The Future of Social Interaction
          </h2>
          <p className="text-white/40 mb-8 font-light leading-relaxed">
            Connect at the speed of light. Secure, anonymous, and powered by intelligence.
          </p>

          <div className="grid grid-cols-1 gap-4 mb-10 text-left">
            <Feature icon={<Shield className="text-jtweet-cyan" size={18} />} title="Privacy First" desc="Encrypted identity layers." />
            <Feature icon={<Zap className="text-jtweet-cyan" size={18} />} title="Instant Reach" desc="Zero-latency global sync." />
            <Feature icon={<Sparkles className="text-jtweet-cyan" size={18} />} title="AI Insights" desc="Intelligent feed optimization." />
          </div>

          <button 
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full bg-white text-jtweet-black font-bold py-4 rounded-3xl flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] group"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/pwa/google.svg" alt="Google" className="w-6 h-6" />
            Continue with Google
            <motion.div
              animate={{ x: [0, 5, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <Zap size={18} className="text-jtweet-cyan ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          </button>

          <p className="mt-8 text-xs text-white/20">
            By continuing, you agree to the JTweet Protocol & Neural Terms.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors">
      <div className="p-2 bg-white/5 rounded-xl border border-white/10">{icon}</div>
      <div>
        <p className="text-sm font-bold text-white leading-tight">{title}</p>
        <p className="text-xs text-white/30 leading-tight">{desc}</p>
      </div>
    </div>
  );
}
