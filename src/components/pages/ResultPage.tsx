import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { motion, useScroll, useTransform } from 'framer-motion';
import { InsightBox } from './InsightBox';
import type { ReactNode } from 'react';

// Local icons (inline SVG, no extra deps)
const StarIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M12 3.75l2.985 6.048 6.682.972-4.833 4.713 1.14 6.651L12 18.75l-6.974 3.384 1.14-6.651L1.333 10.77l6.682-.972L12 3.75z"/>
  </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>
);

const BookOpenIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 5.5A2.5 2.5 0 015.5 3H12v15H5.5A2.5 2.5 0 013 15.5v-10z"/>
    <path d="M21 5.5A2.5 2.5 0 0018.5 3H12v15h6.5A2.5 2.5 0 0021 15.5v-10z"/>
  </svg>
);

// Status icons for scholarship cards
const CheckCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

const XCircleIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

// Reusable wrapper for the AI insight sections
interface AIInsightBoxProps {
  title: string;
  icon: ReactNode;
  children?: ReactNode;
  placeholder?: ReactNode;
}

const AIInsightBox: React.FC<AIInsightBoxProps> = ({ title, icon, children, placeholder }) => {
  const hasContent = React.useMemo(() => {
    if (children === undefined || children === null) return false;
    if (typeof children === 'string') return children.trim().length > 0;
    return true;
  }, [children]);

  return (
    <section className="relative">
      <div className="hb-insight-card relative bg-white rounded-2xl px-8 py-6 shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all hover:-translate-y-[2px]">
        <span aria-hidden className="absolute left-0 top-4 bottom-4 w-[6px] bg-[#F97316] rounded-full" />
        <div className="flex items-start gap-3 md:gap-4">
          <div className="shrink-0 mt-0.5 text-orange-500">
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] md:text-[22px] font-semibold text-stone-800 mb-2">{title}</h3>
            <div className="text-[15px] md:text-[16px] leading-loose text-gray-700">
              {hasContent ? (
                children
              ) : (
                <p className="italic text-[var(--rp-text-muted)]">(Đang phát triển – dữ liệu sẽ hiển thị ở đây)</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Types
interface ReasonObject { message: string }
type Reason = string | ReasonObject;
interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons?: Reason[];
  logoUrl?: string;
}

interface ResultPageProps {
  userName: string;
  eligibilityResults: Scholarship[];
  cmsResultText?: string; // deprecated in UI: CTA pulled from admin config only
  messageType?: 'fail_all' | 'pass_all' | 'pass_some';
  eligible?: boolean;
}

export const ResultPage: React.FC<ResultPageProps> = ({ userName, eligibilityResults = [], messageType, eligible }) => {
  const resultPageConfig = useQuery(api.resultPage.getResultPageConfig, {});

  // Eligibility summary
  const allFailed = useMemo(() => {
    if (messageType === 'fail_all') return true;
    if (messageType) return false;
    return eligibilityResults.every(r => !r.eligible);
  }, [eligibilityResults, messageType]);

  const allPassed = useMemo(() => {
    if (messageType === 'pass_all') return true;
    if (messageType) return false;
    return eligibilityResults.every(r => r.eligible);
  }, [eligibilityResults, messageType]);

  const passedSome = useMemo(() => {
    if (messageType === 'pass_some') return true;
    if (messageType) return false;
    return !allFailed && !allPassed;
  }, [eligibilityResults, messageType, allFailed, allPassed]);

  // AI analysis fetch
  const [aiFeedback, setAiFeedback] = React.useState<string>('');
  const [loadingAI, setLoadingAI] = React.useState<boolean>(false);

  const eligibleScholarships = useMemo(() => eligibilityResults.filter(r => r.eligible), [eligibilityResults]);
  const failedScholarships = useMemo(() => eligibilityResults.filter(r => !r.eligible), [eligibilityResults]);
  const allReasonsText = useMemo(() => {
    const reasons = failedScholarships.flatMap(s => s.reasons || []);
    return reasons.map(r => typeof r === 'string' ? r : r.message);
  }, [failedScholarships]);

  const passedScholarshipNames = eligibleScholarships.map(s => s.name).join(', ');
  const failedScholarshipNames = failedScholarships.map(s => s.name).join(', ');
  const reasonsText = allReasonsText.length > 0 ? allReasonsText.join(', ') : '';

  React.useEffect(() => {
    const httpActionsUrl = (import.meta as any).env?.VITE_HTTP_ACTIONS_URL as string | undefined;
    const convexUrl = (import.meta as any).env?.VITE_CONVEX_URL as string | undefined;
    const normalizedBase = httpActionsUrl?.replace('convex.cloud', 'convex.site') || (convexUrl ? convexUrl.replace('.convex.cloud', '.convex.site') : undefined);
    const url = normalizedBase ? `${normalizedBase.replace(/\/+$/, '')}/api/analysis` : `/api/analysis`;

    const profile = { userName, passedScholarships: passedScholarshipNames, failedScholarships: failedScholarshipNames, reasons: reasonsText };
    const controller = new AbortController();
    setLoadingAI(true);
    fetch(url + `?layer=${encodeURIComponent('Result Page')}` , {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ layer: 'Result Page', profile }), signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({ error: `${r.status}` }));
          const msg = j?.error || `HTTP ${r.status}`;
          setAiFeedback(`Lỗi: ${msg}`);
          return;
        }
        const j = await r.json();
        const combined = [j.overall, j.fit_with_scholarship, j.contextual_insight, j.next_step].filter(Boolean).join('\n\n');
        setAiFeedback(combined || '');
      })
      .catch(() => setAiFeedback(''))
      .finally(() => setLoadingAI(false));
    return () => controller.abort();
  }, [userName, passedScholarshipNames, failedScholarships, reasonsText]);

  // Template helper for CTA bar
  const renderTemplate = (tpl: string, ctx: Record<string, string>) => tpl
    .replace(/\{\{\s*fullname\s*\}\}/gi, ctx.fullname || ctx.userName || '')
    .replace(/\{\{\s*userName\s*\}\}/gi, ctx.userName || '')
    .trim();

  const scenario = allFailed ? 'fail' : allPassed ? 'pass_all' : 'pass_some';
  const configMessages = (() => {
    const defaultCTA = '';
    const cfg = resultPageConfig || {} as any;
    if (scenario === 'fail') {
      return { subheading: cfg.allFailedSubheading || '', message: cfg.allFailedMessage || '', fallbackMessage: cfg.fallbackMessage || '', ctaText: cfg.ctaText || defaultCTA, heroImageUrl: cfg.heroImageUrl };
    }
    if (scenario === 'pass_all') {
      return { subheading: cfg.allPassedSubheading || '', message: cfg.allPassedMessage || '', fallbackMessage: cfg.fallbackMessage || '', ctaText: cfg.ctaText || defaultCTA, heroImageUrl: cfg.heroImageUrl };
    }
    return { subheading: cfg.passedSomeSubheading || '', message: cfg.passedSomeMessage || '', fallbackMessage: cfg.fallbackMessage || '', ctaText: cfg.ctaText || defaultCTA, heroImageUrl: cfg.heroImageUrl };
  })();

  const ctaBarTextRaw = configMessages.ctaText || '';
  const ctaBarText = renderTemplate(ctaBarTextRaw, { fullname: userName, userName });

  // Hero title (gradient text) uses subheading from admin, templated with name
  const heroTitle = renderTemplate(configMessages.subheading || '', { fullname: userName, userName });

  // Actions
  const handleSelectScholarship = (scholarship: Scholarship) => {
    const url = new URL(window.location.href);
    url.searchParams.set('ui', 'smart-profile');
    url.searchParams.set('sch', scholarship.id);
    window.location.href = url.toString();
  };

  // Parallax on the page wrapper
  const paperRef = React.useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: paperRef, offset: ['start end', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <motion.div
      ref={paperRef}
      className={`min-h-screen rp-page-bg px-4 py-6 md:px-6 md:py-8 safe-area relative overflow-hidden font-sans`}
      style={{ fontFamily: "'Inter','Plus Jakarta Sans', system-ui, sans-serif", y: parallaxY }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mx-auto" style={{ maxWidth: '1120px' }}>
        <div className="rp-main">
          {/* Row 1 – Hero Strip (brand, big title left + achievement image right) */}
          <div className="rp-hero-wrap">
            <div className="grid rp-hero-grid gap-3 md:gap-6 items-center">
              {/* Left: brand + big title + message */}
              <div>
                <div className="rp-hero-brand mb-2">Sanhocbong.com.vn</div>
                <div className="rp-hero-title-strong">{heroTitle}</div>
                <div className="rp-hero-sub mt-2 text-[15px] leading-7">{configMessages.message}</div>
              </div>
              {/* Right: achievement image / placeholder */}
              <div>
                <div className="rp-hero-achievement">
                  <div className="rp-hero-frame">
                    {configMessages.heroImageUrl ? (
                      <img src={configMessages.heroImageUrl} alt="Hình minh hoạ thành tựu" />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1521295121783-8a321d551ad2?q=80&w=600&auto=format&fit=crop" alt="Hình minh hoạ" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2 – Section heading (green title + gold line + italic intro) */}
          <div className="mt-6 md:mt-10 text-center mb-4 md:mb-6">
            <h2 className="hb-section-title">Phân tích tổng quan hồ sơ & Định hướng</h2>
            <div className="hb-section-underline mx-auto mt-2" />
            <p className="hb-section-sub mx-auto mt-4 max-w-3xl italic">
              "Chúc mừng Thành viên! Với vai trò là người đồng hành, chúng tôi nhận thấy bạn đã có những bước tiến vững chắc trong hành trình chinh phục học bổng."
            </p>
          </div>

          {/* Row 3 – AI Insights (three boxes) */}
          <div className="mt-10 space-y-8">
            {/* Box 1: Định vị Chiến lược (Strategic Positioning) */}
            <AIInsightBox
              title="Định vị Chiến lược (Strategic Positioning)"
              icon={<StarIcon className="w-7 h-7 md:w-8 md:h-8" />}
            >
              {/* Keep the original AI Insight content */}
              <InsightBox hideTitle feedback={aiFeedback} loading={loadingAI} configMessages={{ ctaText: configMessages.ctaText }} />
            </AIInsightBox>

            {/* Box 2: Sức mạnh Nền tảng (Foundational Strengths) */}
            <AIInsightBox
              title="Sức mạnh Nền tảng (Foundational Strengths)"
              icon={<UsersIcon className="w-7 h-7 md:w-8 md:h-8" />}
              placeholder={<p className="italic text-[var(--rp-text-muted)]">(Đang phát triển – dữ liệu sẽ hiển thị ở đây)</p>}
            />

            {/* Box 3: Khuyến nghị Hành động (Next Steps) */}
            <AIInsightBox
              title="Khuyến nghị Hành động (Next Steps)"
              icon={<BookOpenIcon className="w-7 h-7 md:w-8 md:h-8" />}
              placeholder={<p className="italic text-[var(--rp-text-muted)]">(Đang phát triển – dữ liệu sẽ hiển thị ở đây)</p>}
            />
          </div>

          {/* Row 3 – CTA Banner (from Admin). Hidden if empty */}
          {ctaBarText.trim().length > 0 && (
            <div className="mt-6">
              <div className="hb-cta-banner text-center font-semibold">{ctaBarText}</div>
            </div>
          )}

          {/* Row 4 – Scholarship Grid */}
          <div className="mt-6">
            {eligibilityResults.length > 0 ? (
              <div className="hb-grid-wrap">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {eligibilityResults.map((s) => {
                    const statusText = s.eligible ? 'Đủ Điều Kiện' : 'Chưa Đủ Điều Kiện';
                    const statusClass = s.eligible ? 'hb-status hb-status-ok' : 'hb-status hb-status-no';
                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectScholarship(s)}
                        className="hb-sch-card text-left focus:outline-none"
                      >
                        {/* Status bar inside the card */}
                        <div className={statusClass}>
                          <span>{statusText}</span>
                          <span className="inline-flex items-center">
                            {s.eligible ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                              <XCircleIcon className="w-5 h-5" />
                            )}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="hb-sch-title line-clamp-2 mt-3">{s.name}</h3>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-[var(--rp-text-muted)] text-base">{configMessages.fallbackMessage}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
