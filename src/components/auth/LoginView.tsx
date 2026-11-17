import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowRight, Globe, Lock, Mail, Moon, Sun } from 'lucide-react';
import type { Language, ThemeMode } from '../../types/ems';
import { tr } from '../../lib/i18n';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';

interface LoginViewProps {
  lang: Language;
  onChangeLang: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  initialError?: string;
  onSignIn: (email: string, password: string) => Promise<void>;
}

export const LoginView: React.FC<LoginViewProps> = ({
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  initialError = '',
  onSignIn,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    if (reduced || !cardRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, [reduced]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onSignIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8"
    >
      <div
        ref={cardRef}
        className="w-full max-w-md app-shell-container rounded-[28px] p-7 sm:p-9 relative"
      >
        {/* Top Utility Strip */}
        <div className="flex items-center justify-between gap-3 mb-7">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#232325] text-white flex items-center justify-center shadow-[0_8px_18px_-4px_rgba(35,35,37,0.4)]">
              <svg viewBox="0 0 28 28" className="w-5 h-5" fill="none" aria-hidden="true">
                <path
                  d="M6 20V8l6 7.5L18 8v12"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="21.5" cy="8.5" r="2.3" fill="#F8D568" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)]">
                Nmat Al Nahdat
              </div>
              <div className="text-[11px] text-[var(--text-secondary)]">
                {tr(lang, 'Saudi Arabia · SAR', 'সৌদি আরব · SAR', 'المملكة العربية السعودية · ريال')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                onChangeLang(lang === 'en' ? 'bn' : lang === 'bn' ? 'ar' : 'en')
              }
              aria-label="Switch language"
              className="h-9 px-2.5 rounded-full soft-capsule flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span>{lang === 'bn' ? 'বাংলা' : lang === 'ar' ? 'العربية' : 'EN'}</span>
            </button>
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full soft-capsule flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="soft-card p-6 sm:p-7">
          <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
            {tr(
              lang,
              'Sign in to your workspace',
              'আপনার ওয়ার্কস্পেসে সাইন ইন করুন',
              'تسجيل الدخول إلى مساحة العمل'
            )}
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {tr(
              lang,
              'Connects directly to your existing Nmat Al Nahdat Supabase records.',
              'আপনার বিদ্যমান Nmat Al Nahdat Supabase তথ্যের সাথে সরাসরি যুক্ত।',
              'اتصال مباشر بسجلات نمط النهضة الحالية على Supabase.'
            )}
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {(error || initialError) && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-[#F05A65]/12 border border-[#F05A65]/30 text-xs font-semibold text-[#C9323E] dark:text-[#FF8A93]"
              >
                {error || initialError}
              </div>
            )}

            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                {tr(lang, 'Email address', 'ইমেইল', 'البريد الإلكتروني')}
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[var(--text-muted)] absolute start-3.5 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full h-11 ps-10 pe-3.5 rounded-2xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5"
              >
                {tr(lang, 'Password', 'পাসওয়ার্ড', 'كلمة المرور')}
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[var(--text-muted)] absolute start-3.5 pointer-events-none" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 ps-10 pe-3.5 rounded-2xl soft-surface-secondary text-sm text-[var(--text-primary)] outline-none focus:border-[#4388FF]"
                />
              </div>
            </div>

            <AnimatedButton
              type="submit"
              variant="teal"
              size="lg"
              loading={loading}
              className="w-full h-11"
            >
              <span>
                {tr(
                  lang,
                  'Sign in to workspace',
                  'ওয়ার্কস্পেসে প্রবেশ করুন',
                  'الدخول إلى مساحة العمل'
                )}
              </span>
              <ArrowRight className="w-4 h-4 rtl:rotate-180" />
            </AnimatedButton>
          </form>
        </div>
      </div>
    </div>
  );
};
