import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { motion, useScroll, useTransform } from 'framer-motion';
import { InsightBox } from './InsightBox';

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
          {/* Row 1 – Hero Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <div className="md:col-span-1">
              <div className="ratio-16-9">
                {configMessages.heroImageUrl ? (
                  <img src={configMessages.heroImageUrl} alt="Hero" />
                ) : (
                  <div className="absolute inset-0 rounded-[16px] bg-[var(--rp-section-tint)] border border-[var(--rp-card-border)]" />
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <div>
                <div className="rp-hero-title">{heroTitle}</div>
                <div className="rp-hero-sub mt-2 text-[14px] md:text-[15px] leading-6">{configMessages.message}</div>
              </div>
            </div>
          </div>

          {/* Row 2 – Analysis (Khung C) */}
          <div className="mt-6 -mx-3 sm:mx-0">
            <InsightBox feedback={aiFeedback} loading={loadingAI} configMessages={{ ctaText: configMessages.ctaText }} />
          </div>

          {/* Row 3 – CTA Bar (from Admin). Hidden if empty */}
          {ctaBarText.trim().length > 0 && (
            <div className="mt-5 rp-cta-bar">
              <div className="leading-7">{ctaBarText}</div>
            </div>
          )}

          {/* Row 4 – Scholarship Grid */}
          <div className="mt-6">
            {eligibilityResults.length > 0 ? (
              <div className="rp-grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {eligibilityResults.map((s) => {
                  const chipClass = 'rp-chip-neutral';
                  const chipText = s.eligible ? 'Eligible' : 'Not eligible';
                  return (
                    <button key={s.id} onClick={() => handleSelectScholarship(s)} className="rp-card text-left focus:outline-none">
                      <div className="flex flex-col h-full">
                        <div className="flex items-center gap-3">
                          {s.logoUrl ? (
                            <img src={s.logoUrl} alt={s.name} className="h-8 w-8 object-contain rounded-md border border-[var(--rp-card-border)]" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[var(--rp-section-tint)] text-[var(--rp-accent)] flex items-center justify-center font-semibold border border-[var(--rp-card-border)]">
                              {s.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <h3 className="font-bold text-[16px] leading-6 text-[var(--rp-text)] flex-1 line-clamp-2">{s.name}</h3>
                        </div>
                        <div className="mt-3">
                          <span className={chipClass}>{chipText}</span>
                        </div>
                        <div className="mt-auto" />
                      </div>
                    </button>
                  );
                })}
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
