import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { InsightBox } from './InsightBox';

// Define the Scholarship interface
interface ReasonObject { message: string; }

type Reason = string | ReasonObject;

interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons?: Reason[];
  logoUrl?: string; // Optional: admin-uploaded logo
}

interface ResultPageProps {
  userName: string;
  eligibilityResults: Scholarship[];
  cmsResultText?: string;
  messageType?: "fail_all" | "pass_all" | "pass_some";
  eligible?: boolean;
}

export const ResultPage: React.FC<ResultPageProps> = ({  userName,  eligibilityResults = [],  cmsResultText, messageType, eligible }) => {
  const resultPageConfig = useQuery(api.resultPage.getResultPageConfig, {});
  
  const [showConfetti, setShowConfetti] = React.useState(false);
  React.useEffect(() => {
    const hasEligible = typeof eligible === 'boolean' ? eligible : eligibilityResults.some(r => r.eligible);
    if (hasEligible) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 2500);
      return () => clearTimeout(t);
    }
  }, [eligible, eligibilityResults]);

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
  
  React.useEffect(() => {
    console.log('ResultPage props:', {
      userName,
      eligibilityResults,
      eligible,
      messageType,
      allFailed,
      allPassed,
      passedSome,
      eligibleScholarshipsCount: eligibilityResults.filter(r => r.eligible).length
    });
  }, [userName, eligibilityResults, eligible, messageType, allFailed, allPassed, passedSome]);
  
  const eligibleScholarships = useMemo(() => eligibilityResults.filter(r => r.eligible), [eligibilityResults]);
  const failedScholarships = useMemo(() => eligibilityResults.filter(r => !r.eligible), [eligibilityResults]);
  const allReasonsText = useMemo(() => {
    const reasons = failedScholarships.flatMap(s => s.reasons || []);
    return reasons.map(reason => typeof reason === 'string' ? reason : reason.message);
  }, [failedScholarships]);

  // Helper: render template variables in CTA
  const renderTemplate = (tpl: string, ctx: Record<string, string>) => {
    return tpl
      .replace(/\{\{\s*fullname\s*\}\}/gi, ctx.fullname || ctx.userName || '')
      .replace(/\{\{\s*userName\s*\}\}/gi, ctx.userName || '')
      .trim();
  };

  const passedScholarshipNames = eligibleScholarships.map(s => s.name).join(', ');
  const failedScholarshipNames = failedScholarships.map(s => s.name).join(', ');
  const reasonsText = allReasonsText.length > 0 ? allReasonsText.join(', ') : "không có lý do fail, hồ sơ rất mạnh";

  // Fetch AI feedback from HTTP action /api/analysis (AI Engine, layer: Result Page)
  const [aiFeedback, setAiFeedback] = React.useState<string>('');
  const [loadingAI, setLoadingAI] = React.useState<boolean>(false);

  React.useEffect(() => {
    const httpActionsUrl = (import.meta as any).env?.VITE_HTTP_ACTIONS_URL as string | undefined;
    const baseUrl = httpActionsUrl || 'https://strong-ermine-969.convex.site';
    const url = `${baseUrl}/api/analysis`;

    const profile = {
      userName,
      passedScholarships: passedScholarshipNames,
      failedScholarships: failedScholarshipNames,
      reasons: reasonsText,
    };

    const controller = new AbortController();
    setLoadingAI(true);
    fetch(url + `?layer=${encodeURIComponent('Result Page')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layer: 'Result Page', profile }),
      signal: controller.signal,
    })
      .then(async (r) => {
        if (!r.ok) {
          const j = await r.json().catch(() => ({ error: `${r.status}` }));
          const msg = j?.error || `HTTP ${r.status}`;
          setAiFeedback(`Lỗi: ${msg}`);
          return;
        }
        const j = await r.json();
        const combined = [j.overall, j.fit_with_scholarship, j.contextual_insight, j.next_step]
          .filter(Boolean)
          .join('\n\n');
        setAiFeedback(combined || '');
      })
      .catch((err) => {
        setAiFeedback(`Lỗi: ${String(err?.message || err)}`);
      })
      .finally(() => setLoadingAI(false));

    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userName, passedScholarshipNames, failedScholarshipNames, reasonsText]);
  
  const getConfigMessages = () => {
    const defaultCTA = "Một số học bổng phù hợp với bạn. Hãy chọn học bổng bên dưới để xem điểm mạnh/điểm yếu và cách nâng hồ sơ.";
    if (!resultPageConfig) {
      return {
        message: 'Dưới đây là kết quả đánh giá học bổng của bạn.',
        subheading: 'Kết quả đánh giá học bổng',
        fallbackMessage: "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
        ctaText: defaultCTA,
        heroImageUrl: undefined as string | undefined,
      };
    }
    switch (true) {
      case allFailed:
        return {
          message: resultPageConfig.allFailedMessage || 'Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào.',
          subheading: resultPageConfig.allFailedSubheading || 'Hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || defaultCTA,
          heroImageUrl: resultPageConfig.heroImageUrl,
        };
      case allPassed:
        return {
          message: resultPageConfig.allPassedMessage || 'Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng.',
          subheading: resultPageConfig.allPassedSubheading || 'Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || defaultCTA,
          heroImageUrl: resultPageConfig.heroImageUrl,
        };
      case passedSome:
      default:
        return {
          message: resultPageConfig.passedSomeMessage || 'Dưới đây là danh sách các học bổng bạn đủ điều kiện.',
          subheading: resultPageConfig.passedSomeSubheading || 'Dưới đây là danh sách các học bổng bạn đủ điều kiện',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || defaultCTA,
          heroImageUrl: resultPageConfig.heroImageUrl,
        };
    }
  };

  const configMessages = getConfigMessages();
  const displayCTATextRaw = cmsResultText || configMessages.ctaText;
  const processedCTAText = renderTemplate(displayCTATextRaw || '', { fullname: userName, userName });
  const displayFallbackMessage = configMessages.fallbackMessage;

  const handleCTAClick = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('ui', 'smart-profile');
    window.location.href = url.toString();
  };

  const handleSelectScholarship = (scholarship: Scholarship) => {
    const url = new URL(window.location.href);
    url.searchParams.set('ui', 'smart-profile');
    url.searchParams.set('sch', scholarship.id);
    window.location.href = url.toString();
  };

  const statusClasses = allPassed
    ? 'bg-green-50 border-l-4 border-green-500 text-green-800'
    : allFailed
    ? 'bg-red-50 border-l-4 border-red-500 text-red-800'
    : 'bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800';

  const pageBgClasses = 'bg-gradient-to-b from-[#EAF6FF] to-[#FFFFFF]';
  const calloutText = allFailed
    ? 'Hiện tại bạn chưa đủ điều kiện. Đừng nản! Chọn Smart Profile Analysis để biết cách nâng hồ sơ và cải thiện điểm yếu.'
    : allPassed
    ? 'Bạn đang có lợi thế! Chọn học bổng bạn quan tâm để xem cơ hội và hướng dẫn nộp hồ sơ.'
    : 'Bạn muốn biết mình có bao nhiêu % cơ hội đậu, điểm mạnh – điểm yếu ở đâu, và cách nâng hồ sơ? Chọn học bổng bạn quan tâm bên dưới để xem ngay!';

  const paperRef = React.useRef<HTMLDivElement | null>(null);
  const { scrollYProgress } = useScroll({ target: paperRef, offset: ['start end', 'end start'] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], [-2, 2]);

  return (
    <motion.div
      ref={paperRef}
      className={`min-h-screen bg-gradient-to-b from-[rgb(var(--hb-blue-50))] to-white px-4 py-6 md:px-6 md:py-8 safe-area relative overflow-hidden font-sans`}
      style={{ fontFamily: "'Inter','Plus Jakarta Sans', system-ui, sans-serif", y: parallaxY }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* warm subtle vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(1200px 600px at 80% -10%, rgba(var(--hb-blue),0.08), transparent 60%)',
          backgroundSize: 'cover'
        }}
      />
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => {
            const startX = Math.random() * window.innerWidth;
            const driftX = (Math.random() - 0.5) * 100;
            const duration = 1.2 + Math.random() * 1.2;
            const size = 6 + Math.random() * 8;
            const colors = ['#00d2ff', '#3a7bd5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
            const color = colors[i % colors.length];
            return (
              <motion.div
                key={i}
                initial={{ x: startX, y: -40, rotate: 0, opacity: 1 }}
                animate={{ x: startX + driftX, y: window.innerHeight + 40, rotate: 360 }}
                transition={{ duration, ease: 'easeOut' }}
                style={{ width: size, height: size, backgroundColor: color, borderRadius: 2, boxShadow: '0 0 6px rgba(0,0,0,0.08)' }}
                className="absolute"
              />
            );
          })}
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Row A: Professional App Header Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={messageType}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="relative group rounded-2xl bg-white/90 border border-[rgba(0,0,0,0.06)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] px-6 py-5 animate-fadeInUp"
          >
            <div className="flex items-start gap-3">
              {/* compact hero icon/logo */}
                            {configMessages.heroImageUrl ? (
                <img
                  src={configMessages.heroImageUrl}
                  alt="K???t qu??? h???c b??\u0007ng"
                  className="w-10 h-10 rounded-xl object-cover border border-[rgba(0,0,0,0.06)] shadow-[0_4px_10px_rgba(0,0,0,0.06)]"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-[rgba(0,0,0,0.06)] shadow-[0_4px_10px_rgba(0,0,0,0.06)] bg-white">
                  dYZ"
                </div>
              )}

              {/* text block */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎉</span>
                  <h2 className="serif-title text-[22px] font-bold text-[rgb(var(--hb-dark))] tracking-tight">
                    {configMessages.subheading}
                  </h2>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-[14px] text-[rgb(var(--hb-dark))]/80">
                  <span>💬</span>
                  <p className="leading-relaxed">{configMessages.message}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Row B: Insight Box with AI feedback and CTA */}
        <motion.div className="mt-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <InsightBox
            feedback={loadingAI ? 'Đang tạo nhận xét...' : aiFeedback}
            ctaText={processedCTAText}
            onCTAClick={handleCTAClick}
            configMessages={{ ctaText: configMessages.ctaText }}
          />
        </motion.div>

        {/* Câu hỏi dẫn hướng */}
        <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-[rgb(var(--hb-blue-50))] border-l-4 border-[rgb(var(--hb-yellow))] rounded-2xl p-5">
            <div className="flex items-center text-lg font-semibold text-[rgb(var(--hb-dark))]">
              <span className="mr-2">🎯</span>
              <span>{calloutText}</span>
            </div>
          </div>
        </motion.div>

        {/* Row D: Scholarships Grid */}
        <motion.div className="mt-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          {eligibilityResults.length > 0 ? (
            <div className="relative grid grid-cols-2 gap-4 sm:gap-4 md:gap-4 p-1">
              <div className="hairline-divider-y"></div>
              {eligibilityResults.map((s, idx) => {
                const badgeClasses = s.eligible
                  ? 'bg-[rgb(var(--hb-blue-50))] text-[rgb(var(--hb-dark))] border border-[rgba(50,176,255,0.35)]'
                  : 'bg-[rgb(var(--hb-yellow-50))] text-[rgb(var(--hb-dark))] border border-[rgba(255,214,107,0.45)]';
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScholarship(s)}
                    className="group w-full rounded-2xl bg-white border border-[rgba(0,0,0,0.06)] shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden p-5 md:p-5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] hover:-translate-y-0.5 transition-all focus:outline-none"
                  >
                    <div className="flex flex-col items-center justify-start">
                      {s.logoUrl ? (
                        <img src={s.logoUrl} alt={s.name} className="h-8 object-contain" />
                      ) : (
                        <div className="icon-chip text-xs font-semibold">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="mt-2 text-center">
                        <div className="text-[15px] font-semibold text-[rgb(var(--hb-dark))] tracking-tight">{s.name}</div>
                      </div>
                      <div className="mt-2">
                        <span className={`badge-neutral ${badgeClasses}`}>{s.eligible ? 'Đủ điều kiện' : 'Không đủ điều kiện'}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-600 text-base">{displayFallbackMessage}</p>
            </div>
          )}
        </motion.div>

        {/* Removed Row E: CTA Buttons (CTA now shown under Insight Box) */}
      </div>
    </motion.div>
  );
};