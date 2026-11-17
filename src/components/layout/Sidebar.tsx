import React, { useRef, useState } from 'react';
import gsap from 'gsap';
import {
  LayoutGrid,
  Search,
  Bell,
  Users,
  Home,
  Building2,
  Plane,
  Wallet,
  Banknote,
  History,
  Settings,
  X,
} from 'lucide-react';
import type { Language, PageRoute } from '../../types/ems';
import { tr } from '../../lib/i18n';
import { usePrefersReducedMotion, useSlidingPill } from '../../hooks/useGsapAnimations';

interface SidebarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  lang: Language;
  reminderCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  businessName: string;
}

interface NavGroup {
  id: string;
  items: Array<{
    page: PageRoute;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  lang,
  reminderCount,
  mobileOpen,
  onCloseMobile,
  businessName,
}) => {
  const railRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const [hoveredPage, setHoveredPage] = useState<PageRoute | null>(null);
  const reduced = usePrefersReducedMotion();

  const activeNavPage: PageRoute =
    currentPage === 'profile' ? 'search' : currentPage;

  const groups: NavGroup[] = [
    {
      id: 'overview',
      items: [
        {
          page: 'dashboard',
          label: tr(lang, 'Dashboard', 'ড্যাশবোর্ড', 'لوحة التحكم'),
          icon: LayoutGrid,
        },
        {
          page: 'search',
          label: tr(lang, 'Worker Search', 'কর্মী খুঁজুন', 'البحث عن عامل'),
          icon: Search,
        },
        {
          page: 'reminders',
          label: tr(lang, 'Reminders', 'রিমাইন্ডার', 'التنبيهات'),
          icon: Bell,
          badge: reminderCount > 0 ? reminderCount : undefined,
        },
      ],
    },
    {
      id: 'workforce',
      items: [
        {
          page: 'company',
          label: tr(lang, 'Company Workers', 'কোম্পানির কর্মী', 'عمال الشركات'),
          icon: Users,
        },
        {
          page: 'domestic',
          label: tr(lang, 'Domestic Workers', 'ডোমেস্টিক কর্মী', 'العمالة المنزلية'),
          icon: Home,
        },
        {
          page: 'companies',
          label: tr(lang, 'Companies', 'কোম্পানি', 'الشركات'),
          icon: Building2,
        },
        {
          page: 'visas',
          label: tr(lang, 'Exit Re-entry Visas', 'এক্সিট রি-এন্ট্রি ভিসা', 'تأشيرات الخروج والعودة'),
          icon: Plane,
        },
      ],
    },
    {
      id: 'finance',
      items: [
        {
          page: 'company-payments',
          label: tr(lang, 'Company Payments', 'কোম্পানির পেমেন্ট', 'دفعات الشركات'),
          icon: Wallet,
        },
        {
          page: 'domestic-payments',
          label: tr(lang, 'Domestic Payments', 'ডোমেস্টিক পেমেন্ট', 'دفعات العمالة المنزلية'),
          icon: Banknote,
        },
        {
          page: 'history',
          label: tr(lang, 'Payment History', 'পেমেন্ট ইতিহাস', 'سجل المدفوعات'),
          icon: History,
        },
      ],
    },
    {
      id: 'system',
      items: [
        {
          page: 'settings',
          label: tr(lang, 'Settings & Access', 'সেটিংস ও অ্যাক্সেস', 'الإعدادات والصلاحيات'),
          icon: Settings,
        },
      ],
    },
  ];

  useSlidingPill(
    railRef,
    indicatorRef,
    `[data-sidebar-page="${activeNavPage}"]`,
    [activeNavPage, lang]
  );

  const handleIconHover = (el: Element | null, enter: boolean) => {
    if (reduced || !el) return;
    gsap.to(el, {
      scale: enter ? 1.12 : 1,
      duration: 0.18,
      ease: 'power3.out',
    });
  };

  return (
    <>
      {/* Desktop Slim Floating Rail */}
      <aside
        aria-label="Primary navigation"
        className="hidden lg:flex flex-col items-center w-[74px] shrink-0 py-4 px-2.5 soft-capsule rounded-[26px] select-none relative z-20"
      >
        {/* Brand Emblem */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          title={businessName}
          aria-label={businessName}
          className="w-11 h-11 rounded-2xl bg-[#232325] text-white hover:bg-[#F8D568] hover:text-[#1D1D1F] flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(35,35,37,0.4)] mb-4 cursor-pointer transition-colors duration-200 shrink-0"
        >
          <svg viewBox="0 0 28 28" className="w-6 h-6" fill="none" aria-hidden="true">
            <path
              d="M6 20V8l6 7.5L18 8v12"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="21.5" cy="8.5" r="2.3" fill="#F8D568" />
          </svg>
        </button>

        {/* Icon Rail with GSAP Sliding Active Background */}
        <div
          ref={railRef}
          className="relative flex flex-col items-center w-full flex-1 justify-between gap-2"
        >
          <div
            ref={indicatorRef}
            aria-hidden="true"
            className="absolute top-0 start-0 w-11 h-11 rounded-2xl bg-[#232325] dark:bg-[#F8D568] shadow-[0_8px_18px_-4px_rgba(35,35,37,0.38)] dark:shadow-[0_8px_18px_-4px_rgba(248,213,104,0.4)] pointer-events-none opacity-0"
          />

          <div className="flex flex-col items-center gap-3 w-full">
            {groups.map((group, gIdx) => (
              <React.Fragment key={group.id}>
                {gIdx > 0 && (
                  <div className="w-7 h-px bg-[var(--border-subtle)] my-0.5" aria-hidden="true" />
                )}
                <div className="flex flex-col items-center gap-1.5 w-full">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNavPage === item.page;
                    return (
                      <div
                        key={item.page}
                        className="relative flex items-center justify-center w-full"
                        onMouseEnter={() => setHoveredPage(item.page)}
                        onMouseLeave={() => setHoveredPage(null)}
                      >
                        <button
                          type="button"
                          data-sidebar-page={item.page}
                          onClick={(e) => {
                            const svg = e.currentTarget.querySelector('svg');
                            if (!reduced && svg) {
                              gsap.fromTo(
                                svg,
                                { scale: 0.84 },
                                { scale: 1, duration: 0.28, ease: 'power3.out' }
                              );
                            }
                            onNavigate(item.page);
                          }}
                          onMouseEnter={(e) =>
                            handleIconHover(e.currentTarget.querySelector('svg'), true)
                          }
                          onMouseLeave={(e) =>
                            handleIconHover(e.currentTarget.querySelector('svg'), false)
                          }
                          aria-label={item.label}
                          aria-current={isActive ? 'page' : undefined}
                          className={`relative z-10 w-11 h-11 rounded-2xl flex items-center justify-center cursor-pointer transition-colors duration-200 ${
                            isActive
                              ? 'text-white dark:text-[#1D1D1F]'
                              : 'text-[var(--text-secondary)] hover:bg-[#F8D568]/65 hover:text-[#1D1D1F]'
                          }`}
                        >
                          <Icon className="w-[19px] h-[19px]" />
                          {item.badge !== undefined && (
                            <span
                              className={`absolute -top-0.5 -end-0.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold tabular-nums flex items-center justify-center ${
                                isActive
                                  ? 'bg-[#F8D568] text-[#1D1D1F] dark:bg-[#232325] dark:text-[#F8D568]'
                                  : 'bg-[#E5535E] text-white'
                              }`}
                            >
                              {item.badge > 99 ? '99+' : item.badge}
                            </span>
                          )}
                        </button>

                        {/* Hover Tooltip */}
                        {hoveredPage === item.page && (
                          <div
                            role="tooltip"
                            className="absolute start-[62px] z-50 px-3 py-1.5 rounded-xl soft-float-popover text-xs font-semibold text-[var(--text-primary)] whitespace-nowrap pointer-events-none"
                          >
                            {item.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </aside>

      {/* Mobile Collapsible Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <div
            className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onCloseMobile}
          />
          <nav className="relative z-10 w-72 max-w-[85vw] h-full bg-[var(--surface-primary)] border-e border-[var(--border-subtle)] p-5 flex flex-col overflow-y-auto sleek-scroll">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#153B40] text-white flex items-center justify-center font-bold">
                  N
                </div>
                <span className="font-bold text-sm text-[var(--text-primary)] truncate">
                  {businessName}
                </span>
              </div>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close navigation"
                className="w-9 h-9 rounded-xl bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {groups.map((group) => (
                <div key={group.id} className="flex flex-col gap-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeNavPage === item.page;
                    return (
                      <button
                        key={item.page}
                        type="button"
                        onClick={() => {
                          onNavigate(item.page);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[#232325] text-white dark:bg-[#F8D568] dark:text-[#1D1D1F]'
                            : 'text-[var(--text-secondary)] hover:bg-[#F8D568]/55 hover:text-[#1D1D1F]'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.label}</span>
                        </span>
                        {item.badge !== undefined && (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#F05A65] text-white tabular-nums">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
};
