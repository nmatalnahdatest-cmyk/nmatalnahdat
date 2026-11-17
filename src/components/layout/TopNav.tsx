import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import type {
  Language,
  PageRoute,
  ReminderItem,
  ThemeMode,
  WorkspaceChoice,
  WorkspaceRole,
} from '../../types/ems';
import { tr } from '../../lib/i18n';
import { usePrefersReducedMotion, useSlidingPill } from '../../hooks/useGsapAnimations';
import { AnimatedButton } from '../ui/AnimatedButton';
import { Avatar } from '../ui/Avatar';

interface TopNavProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  onOpenMobileNav: () => void;
  searchQuery: string;
  onGlobalSearch: (q: string) => void;
  onAddWorker: () => void;
  canWrite: boolean;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  reminders: ReminderItem[];
  onOpenWorkerProfile: (id: string) => void;
  userEmail: string;
  role: WorkspaceRole;
  choices: WorkspaceChoice[];
  currentOwner: string;
  onSwitchWorkspace: (ownerId: string) => void;
  onSignOut: () => void;
  businessName: string;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentPage,
  onNavigate,
  onOpenMobileNav,
  searchQuery,
  onGlobalSearch,
  onAddWorker,
  canWrite,
  lang,
  onChangeLang,
  theme,
  onToggleTheme,
  reminders,
  onOpenWorkerProfile,
  userEmail,
  role,
  choices,
  currentOwner,
  onSwitchWorkspace,
  onSignOut,
  businessName,
}) => {
  const pillNavRef = useRef<HTMLDivElement>(null);
  const pillIndicatorRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Close popovers on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (userOpen && userMenuRef.current && !userMenuRef.current.contains(target)) {
        setUserOpen(false);
      }
      if (langOpen && !target.closest('[data-lang-menu]')) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [notifOpen, userOpen, langOpen]);

  const activePillGroup: 'dashboard' | 'employees' | 'reports' | 'none' =
    currentPage === 'dashboard'
      ? 'dashboard'
      : ['company', 'domestic', 'companies', 'visas', 'search', 'profile'].includes(
          currentPage
        )
      ? 'employees'
      : ['company-payments', 'domestic-payments', 'history', 'reminders'].includes(
          currentPage
        )
      ? 'reports'
      : 'none';

  useSlidingPill(
    pillNavRef,
    pillIndicatorRef,
    `[data-top-pill="${activePillGroup}"]`,
    [activePillGroup, lang]
  );

  const toggleSearch = () => {
    const next = !searchOpen;
    setSearchOpen(next);
    if (next) {
      setTimeout(() => searchInputRef.current?.focus(), 40);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGlobalSearch(localQuery);
  };

  const urgentCount = reminders.filter((r) => r.days <= 30).length;

  const animatePopover = (el: HTMLElement | null) => {
    if (!el || reduced) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 8, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power3.out' }
    );
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 w-full relative z-30">
      {/* Left Capsule: Mobile Menu + Brand + Primary Pill Nav */}
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="lg:hidden w-10 h-10 rounded-full soft-capsule flex items-center justify-center text-[var(--text-primary)] cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Capsule Navigation */}
        <div
          ref={pillNavRef}
          className="relative flex items-center p-1.5 rounded-full soft-capsule"
        >
          <div
            ref={pillIndicatorRef}
            aria-hidden="true"
            className="absolute top-0 start-0 rounded-full bg-[#232325] dark:bg-[#F8D568] shadow-[0_6px_16px_-4px_rgba(35,35,37,0.35)] pointer-events-none opacity-0"
          />

          <button
            type="button"
            data-top-pill="dashboard"
            onClick={() => onNavigate('dashboard')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 ${
              activePillGroup === 'dashboard'
                ? 'text-white dark:text-[#1D1D1F]'
                : 'text-[var(--text-secondary)] hover:text-[#1D1D1F] hover:bg-[#F8D568]/55'
            }`}
          >
            {tr(lang, 'Dashboard', 'ড্যাশবোর্ড', 'لوحة التحكم')}
          </button>

          <button
            type="button"
            data-top-pill="employees"
            onClick={() => onNavigate('company')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 ${
              activePillGroup === 'employees'
                ? 'text-white dark:text-[#1D1D1F]'
                : 'text-[var(--text-secondary)] hover:text-[#1D1D1F] hover:bg-[#F8D568]/55'
            }`}
          >
            {tr(lang, 'Employees', 'কর্মীবৃন্দ', 'الموظفون')}
          </button>

          <button
            type="button"
            data-top-pill="reports"
            onClick={() => onNavigate('history')}
            className={`relative z-10 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors duration-200 ${
              activePillGroup === 'reports'
                ? 'text-white dark:text-[#1D1D1F]'
                : 'text-[var(--text-secondary)] hover:text-[#1D1D1F] hover:bg-[#F8D568]/55'
            }`}
          >
            {tr(lang, 'Reports', 'রিপোর্ট', 'التقارير')}
          </button>
        </div>

        <span className="hidden xl:inline-block text-sm font-bold text-[var(--text-primary)] ps-2 truncate max-w-[180px]">
          {businessName}
        </span>
      </div>

      {/* Right Capsule Controls */}
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {/* Expandable Global Search Capsule */}
        <form
          onSubmit={handleSearchSubmit}
          className={`flex items-center rounded-full soft-capsule transition-all duration-200 overflow-hidden ${
            searchOpen ? 'w-52 sm:w-64 px-3 h-10' : 'w-10 h-10 justify-center'
          }`}
        >
          <button
            type="button"
            onClick={toggleSearch}
            aria-label={tr(lang, 'Global Search', 'সার্চ করুন', 'بحث شامل')}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 cursor-pointer flex items-center justify-center"
          >
            <Search className="w-4 h-4" />
          </button>
          {searchOpen && (
            <>
              <input
                ref={searchInputRef}
                type="search"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder={tr(
                  lang,
                  'Iqama, name, phone…',
                  'ইকামা, নাম বা ফোন…',
                  'الإقامة، الاسم، الهاتف…'
                )}
                className="w-full bg-transparent text-xs sm:text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] px-2 outline-none"
              />
              {localQuery && (
                <button
                  type="button"
                  onClick={() => setLocalQuery('')}
                  aria-label="Clear search"
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </form>

        {/* Add Employee Primary CTA */}
        {canWrite && (
          <AnimatedButton
            variant="teal"
            size="md"
            onClick={onAddWorker}
            className="rounded-full h-10 px-4 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {tr(lang, 'Add Employee', 'কর্মী যোগ', 'إضافة موظف')}
            </span>
          </AnimatedButton>
        )}

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !notifOpen;
              setNotifOpen(next);
              setUserOpen(false);
              setLangOpen(false);
              if (next) {
                setTimeout(() => animatePopover(notifRef.current?.querySelector('[data-popover]') ?? null), 10);
              }
            }}
            aria-label={tr(lang, 'Notifications', 'নোটিফিকেশন', 'الإشعارات')}
            className="relative w-10 h-10 rounded-full soft-capsule flex items-center justify-center text-[var(--text-secondary)] hover:bg-[#F8D568] hover:text-[#1D1D1F] transition-colors duration-200 cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {urgentCount > 0 && (
              <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#F05A65] text-white text-[10px] font-bold tabular-nums flex items-center justify-center">
                {urgentCount > 9 ? '9+' : urgentCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div
              data-popover
              className="absolute end-0 mt-2 w-80 max-w-[90vw] rounded-2xl soft-float-popover p-4 z-50"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  {tr(lang, 'Expiry & Visa Reminders', 'মেয়াদ ও ভিসা রিমাইন্ডার', 'تنبيهات الإقامة والتأشيرة')}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen(false);
                    onNavigate('reminders');
                  }}
                  className="text-xs font-semibold text-[#4388FF] hover:underline cursor-pointer"
                >
                  {tr(lang, 'View all', 'সব দেখুন', 'عرض الكل')}
                </button>
              </div>
              <div className="mt-2 max-h-72 overflow-y-auto sleek-scroll divide-y divide-[var(--border-subtle)]">
                {reminders.slice(0, 6).map((r) => (
                  <button
                    key={`${r.e.id}-${r.type}-${r.date}`}
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      onOpenWorkerProfile(r.e.id);
                    }}
                    className="w-full text-start py-2.5 px-1.5 rounded-xl hover:bg-[var(--surface-secondary)] transition-colors flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
                        {r.e.fullName}
                      </p>
                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {r.type} · <span className="font-mono-data">{r.date}</span>
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-bold tabular-nums px-2 py-0.5 rounded-lg shrink-0 ${
                        r.days < 0
                          ? 'bg-[#F05A65]/15 text-[#F05A65]'
                          : r.days <= 7
                          ? 'bg-[#FFD84D]/25 text-[#8A6700] dark:text-[#FFE175]'
                          : 'bg-[#4388FF]/15 text-[#4388FF]'
                      }`}
                    >
                      {r.days < 0 ? `${Math.abs(r.days)}d late` : `${r.days}d`}
                    </span>
                  </button>
                ))}
                {!reminders.length && (
                  <p className="text-xs text-[var(--text-secondary)] py-6 text-center">
                    {tr(
                      lang,
                      'No expiries due within 60 days.',
                      '৬০ দিনের মধ্যে কোনো মেয়াদ শেষ হচ্ছে না।',
                      'لا توجد مواعيد مستحقة خلال ٦٠ يوماً.'
                    )}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Language Switcher */}
        <div className="relative" data-lang-menu>
          <button
            type="button"
            onClick={() => {
              setLangOpen(!langOpen);
              setNotifOpen(false);
              setUserOpen(false);
            }}
            aria-label="Switch language"
            className="h-10 px-3 rounded-full soft-capsule flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[#F8D568] hover:text-[#1D1D1F] transition-colors duration-200 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 opacity-75" />
            <span>{lang === 'bn' ? 'বাংলা' : lang === 'ar' ? 'العربية' : 'EN'}</span>
          </button>

          {langOpen && (
            <div className="absolute end-0 mt-2 w-36 rounded-2xl soft-float-popover p-1.5 z-50">
              {(
                [
                  ['en', 'English'],
                  ['bn', 'বাংলা'],
                  ['ar', 'العربية (RTL)'],
                ] as const
              ).map(([code, label]) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => {
                    onChangeLang(code);
                    setLangOpen(false);
                  }}
                  className={`w-full text-start px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                    lang === code
                      ? 'bg-[#232325] text-white dark:bg-[#F8D568] dark:text-[#1D1D1F]'
                      : 'text-[var(--text-primary)] hover:bg-[#F8D568]/55 hover:text-[#1D1D1F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Light / Dark Theme Toggle */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={
            theme === 'light'
              ? tr(lang, 'Switch to dark theme', 'ডার্ক থিম চালু করুন', 'تفعيل الوضع الداكن')
              : tr(lang, 'Switch to light theme', 'লাইট থিম চালু করুন', 'تفعيل الوضع الفاتح')
          }
          className="w-10 h-10 rounded-full soft-capsule flex items-center justify-center text-[var(--text-secondary)] hover:bg-[#F8D568] hover:text-[#1D1D1F] transition-colors duration-200 cursor-pointer"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* User Profile & Workspace Menu */}
        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => {
              const next = !userOpen;
              setUserOpen(next);
              setNotifOpen(false);
              setLangOpen(false);
              if (next) {
                setTimeout(() => animatePopover(userMenuRef.current?.querySelector('[data-popover]') ?? null), 10);
              }
            }}
            aria-label="Account menu"
            className="h-10 ps-1.5 pe-3 rounded-full soft-capsule flex items-center gap-2 cursor-pointer"
          >
            <Avatar name={userEmail || 'Admin'} size="xs" />
            <span className="hidden md:inline text-xs font-semibold text-[var(--text-primary)] max-w-[110px] truncate">
              {userEmail.split('@')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
          </button>

          {userOpen && (
            <div
              data-popover
              className="absolute end-0 mt-2 w-64 rounded-2xl soft-float-popover p-3.5 z-50"
            >
              <div className="pb-3 border-b border-[var(--border-subtle)]">
                <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                  {userEmail}
                </p>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[var(--text-secondary)]">
                  <UserCheck className="w-3.5 h-3.5 text-[#00C985]" />
                  <span className="capitalize">{role} access</span>
                </div>
              </div>

              {choices.length > 1 && (
                <div className="py-2.5 border-b border-[var(--border-subtle)]">
                  <p className="text-[11px] font-semibold text-[var(--text-secondary)] mb-1.5">
                    {tr(lang, 'Workspace', 'ওয়ার্কস্পেস', 'مساحة العمل')}
                  </p>
                  <div className="flex flex-col gap-1">
                    {choices.map((c) => (
                      <button
                        key={c.owner}
                        type="button"
                        onClick={() => {
                          setUserOpen(false);
                          onSwitchWorkspace(c.owner);
                        }}
                        className={`w-full text-start px-2.5 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                          c.owner === currentOwner
                            ? 'bg-[#4388FF]/12 text-[#4388FF] font-semibold'
                            : 'text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]'
                        }`}
                      >
                        {c.title} · {c.role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2.5 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false);
                    onNavigate('settings');
                  }}
                  className="w-full text-start px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                >
                  {tr(lang, 'Settings & Access', 'সেটিংস ও অ্যাক্সেস', 'الإعدادات والصلاحيات')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false);
                    onSignOut();
                  }}
                  className="w-full text-start px-3 py-2 rounded-xl text-xs font-semibold text-[#F05A65] hover:bg-[#F05A65]/10 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{tr(lang, 'Sign out', 'সাইন আউট', 'تسجيل الخروج')}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
