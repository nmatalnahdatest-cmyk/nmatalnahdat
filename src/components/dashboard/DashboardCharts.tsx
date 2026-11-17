import React, { useLayoutEffect, useMemo, useRef } from 'react';
import gsap from 'gsap';
import { ArrowUpRight } from 'lucide-react';
import type { Employee, Language, Payment } from '../../types/ems';
import { cents, monthNow, sar, workerKind } from '../../lib/accounting';
import { tr } from '../../lib/i18n';
import { usePrefersReducedMotion } from '../../hooks/useGsapAnimations';

interface DashboardChartsProps {
  employees: Employee[];
  payments: Payment[];
  lang: Language;
  onOpenHistory?: () => void;
}

function getLastNMonths(n: number): string[] {
  const now = monthNow();
  const [y, m] = now.split('-').map(Number);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(Date.UTC(y, m - 1 - i, 1));
    out.push(`${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}`);
  }
  return out;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({
  employees,
  payments,
  lang,
  onOpenHistory,
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();

  const monthlySeries = useMemo(() => {
    const months = getLastNMonths(6);
    const grouped = new Map<string, { expected: number; paid: number }>();
    for (const m of months) grouped.set(m, { expected: 0, paid: 0 });

    const workerMonthExpected = new Map<string, number>();
    for (const p of payments) {
      const key = `${p.year}-${String(p.month).padStart(2, '0')}`;
      if (!grouped.has(key)) continue;
      const g = grouped.get(key)!;
      g.paid += cents(p.paidAmount);
      const wmKey = `${p.employeeId}__${key}`;
      const prevExp = workerMonthExpected.get(wmKey) || 0;
      const nextExp = Math.max(prevExp, cents(p.expectedAmount));
      workerMonthExpected.set(wmKey, nextExp);
    }

    for (const [wmKey, exp] of workerMonthExpected.entries()) {
      const mKey = wmKey.split('__')[1];
      const g = grouped.get(mKey);
      if (g) g.expected += exp;
    }

    return months.map((m) => {
      const g = grouped.get(m)!;
      const ratio = g.expected > 0 ? Math.min(1, g.paid / g.expected) : g.paid > 0 ? 1 : 0;
      return {
        period: m,
        label: m.slice(2),
        expected: g.expected / 100,
        paid: g.paid / 100,
        ratio,
      };
    });
  }, [payments]);

  const maxVal = useMemo(() => {
    return Math.max(100, ...monthlySeries.map((s) => Math.max(s.expected, s.paid)));
  }, [monthlySeries]);

  const paidEntriesCount = useMemo(
    () => payments.filter((p) => p.status === 'PAID').length,
    [payments]
  );
  const openEntriesCount = useMemo(
    () => payments.filter((p) => p.status !== 'PAID' && cents(p.balance) > 0).length,
    [payments]
  );

  const live = employees.filter((e) => !e.deletedAt && !e.archived);
  const companyCount = live.filter((e) => workerKind(e) === 'company').length;
  const domesticCount = live.filter((e) => workerKind(e) === 'domestic').length;
  const totalLive = Math.max(1, companyCount + domesticCount);

  useLayoutEffect(() => {
    if (reduced || !chartRef.current) return;
    const ctx = gsap.context(() => {
      const bars = chartRef.current?.querySelectorAll('[data-chart-bar]');
      if (bars && bars.length) {
        gsap.fromTo(
          bars,
          { scaleY: 0, transformOrigin: 'bottom center' },
          {
            scaleY: 1,
            duration: 0.55,
            stagger: 0.04,
            ease: 'power3.out',
            clearProps: 'transform',
          }
        );
      }
      const dots = chartRef.current?.querySelectorAll('[data-matrix-dot]');
      if (dots && dots.length) {
        gsap.fromTo(
          dots,
          { scale: 0.4, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.35,
            stagger: 0.012,
            ease: 'power3.out',
            clearProps: 'transform,opacity',
          }
        );
      }
    }, chartRef);
    return () => ctx.revert();
  }, [monthlySeries, reduced]);

  return (
    <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* 6-Month Collection Bar Chart (Charcoal & Butter Gold) */}
      <section className="soft-card p-5 md:p-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              {tr(
                lang,
                'Monthly Collections (6 Months)',
                'মাসিক কালেকশন (৬ মাস)',
                'التحصيل الشهري (٦ أشهر)'
              )}
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              {tr(
                lang,
                'Expected vs collected SAR from saved monthly records.',
                'সংরক্ষিত মাসিক রেকর্ড থেকে পাওনা ও জমার তুলনা।',
                'مقارنة المستحقات والمبالغ المحصلة بالريال من السجلات المحفوظة.'
              )}
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#232325] dark:bg-[#9CA3AF]" />
              {tr(lang, 'Expected', 'পাওনা', 'المتوقع')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F8D568]" />
              {tr(lang, 'Collected', 'জমা', 'المحصل')}
            </span>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-6 gap-2 sm:gap-4 items-end h-48 pt-4">
          {monthlySeries.map((item) => {
            const expPct = Math.max(4, Math.round((item.expected / maxVal) * 100));
            const paidPct = Math.max(
              item.paid > 0 ? 4 : 0,
              Math.round((item.paid / maxVal) * 100)
            );
            return (
              <div key={item.period} className="flex flex-col items-center h-full justify-end gap-2">
                <div className="w-full flex items-end justify-center gap-1.5 flex-1 max-h-36">
                  <div
                    data-chart-bar
                    title={`${item.period} Expected: ${sar(item.expected)} SAR`}
                    style={{ height: `${item.expected > 0 ? expPct : 4}%` }}
                    className="w-3.5 sm:w-5 rounded-t-xl bg-[#232325]/85 dark:bg-white/25 transition-all"
                  />
                  <div
                    data-chart-bar
                    title={`${item.period} Collected: ${sar(item.paid)} SAR`}
                    style={{ height: `${item.paid > 0 ? paidPct : 2}%` }}
                    className="w-3.5 sm:w-5 rounded-t-xl bg-[#F8D568] shadow-[0_4px_12px_-2px_rgba(248,213,104,0.5)] transition-all"
                  />
                </div>
                <div className="text-center">
                  <div className="text-[11px] font-mono-data font-semibold text-[var(--text-primary)]">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono-data text-[var(--text-secondary)] hidden sm:block">
                    {item.paid > 0 ? sar(item.paid).replace('.00', '') : '0'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Dark Charcoal Contrast Bento Card (Matches Screenshot Attendance Report Card) */}
      <section className="charcoal-card p-5 md:p-6 flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-[#FAF9F5]">
              {tr(lang, 'Collection Report', 'পেমেন্ট রিপোর্ট', 'تقرير التحصيل')}
            </h3>
            <p className="text-xs text-[#A3A5AD] mt-0.5">
              {tr(
                lang,
                `${companyCount} Company · ${domesticCount} Domestic (${Math.round((companyCount / totalLive) * 100)}%)`,
                `${companyCount} কোম্পানি · ${domesticCount} ডোমেস্টিক`,
                `${companyCount} شركة · ${domesticCount} منزلية`
              )}
            </p>
          </div>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              aria-label="Open payment history"
              className="w-9 h-9 rounded-full bg-white/10 text-[#FAF9F5] hover:bg-[#F8D568] hover:text-[#1D1D1F] flex items-center justify-center transition-colors duration-200 cursor-pointer shrink-0"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Clean High-Contrast Numbers */}
        <div className="flex items-baseline gap-6 my-4">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light tabular-nums text-[#FAF9F5]">
              {paidEntriesCount}
            </span>
            <span className="text-xs font-semibold text-[#F8D568]">
              ↗ {tr(lang, 'Paid', 'জমা', 'مدفوع')}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-light tabular-nums text-[#FAF9F5]">
              {openEntriesCount}
            </span>
            <span className="text-xs font-semibold text-[#A3A5AD]">
              ↘ {tr(lang, 'Due', 'বাকি', 'متبقي')}
            </span>
          </div>
        </div>

        {/* Golden Dot Matrix Visualization (6 columns x 5 rows from screenshot) */}
        <div
          className="grid grid-cols-6 gap-2.5 pt-2"
          aria-label="6-month collection dot matrix"
        >
          {monthlySeries.map((col) => {
            const litRows = col.paid > 0 ? Math.max(1, Math.round(col.ratio * 5)) : 0;
            return (
              <div key={col.period} className="flex flex-col items-center gap-1.5">
                {[4, 3, 2, 1, 0].map((rowIdx) => {
                  const isLit = rowIdx < litRows;
                  return (
                    <span
                      key={rowIdx}
                      data-matrix-dot
                      title={`${col.period}: ${Math.round(col.ratio * 100)}% collected`}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        isLit ? 'bg-[#F8D568]' : 'bg-white/15'
                      }`}
                    />
                  );
                })}
                <span className="text-[10px] font-mono-data text-[#9FA2AA] mt-0.5">
                  {col.label.slice(3)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
