import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { AnimatePresence, motion } from 'framer-motion';

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
  
  const aiPromptTemplate = resultPageConfig?.aiPromptConfig || 
    `{{userName}} vừa hoàn thành wizard.\n\nCác học bổng pass: {{passedScholarships}}\nCác học bổng fail: {{failedScholarships}}\nLý do fail: {{reasons}}\n\nHãy viết feedback thân thiện, khích lệ, ngắn gọn 3–4 câu.`;
  
  const passedScholarshipNames = eligibleScholarships.map(s => s.name).join(', ');
  const failedScholarshipNames = failedScholarships.map(s => s.name).join(', ');
  const reasonsText = allReasonsText.length > 0 ? allReasonsText.join(', ') : "không có lý do fail, hồ sơ rất mạnh";
  
  const finalPrompt = aiPromptTemplate
    .replace('{{userName}}', userName)
    .replace('{{passedScholarships}}', passedScholarshipNames)
    .replace('{{failedScholarships}}', failedScholarshipNames)
    .replace('{{reasons}}', reasonsText);
  
  const aiFeedback = useMemo(() => {
    console.log("AI Prompt:", finalPrompt);
    if (allFailed) {
      return `Xin chào ${userName}, sau khi đánh giá hồ sơ của bạn, chúng tôi thấy bạn chưa đáp ứng đủ các yêu cầu cho các học bổng hiện tại. Đây là mội cơ hội để bạn cải thiện hồ sơ. Hãy xem xét việc nâng cao trình độ tiếng Anh, tích lũy thêm kinh nghiệm làm việc hoặc bổ sung các dự án liên quan.`;
    } else if (allPassed) {
      return `Xin chào ${userName}, chúc mừng! Hồ sơ của bạn rất xuất sắc và đáp ứng đầy đủ các yêu cầu cho tất cả các học bổng. Đây là mội bước đột phá trong hành trình học thuật của bạn. Hãy tiếp tục phát huy những ưu điểm này.`;
    } else {
      return `Xin chào ${userName}, sau khi đánh giá hồ sơ, chúng tôi thấy bạn đủ điều kiện cho một số học bổng. Đây là mội kết quả tuyệt vời! Để cải thiện thêm, hãy tập trung vào các điểm yếu được chỉ ra để gia tăng cơ hội nhận học bổng.`;
    }
  }, [finalPrompt, userName, allFailed, allPassed]);
  
  const getConfigMessages = () => {
    if (!resultPageConfig) {
      return {
        message: 'Dưới đây là kết quả đánh giá học bổng của bạn.',
        subheading: 'Kết quả đánh giá học bổng',
        fallbackMessage: "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
        ctaText: "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis.",
        heroImageUrl: undefined as string | undefined,
      };
    }
    switch (true) {
      case allFailed:
        return {
          message: resultPageConfig.allFailedMessage || 'Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào.',
          subheading: resultPageConfig.allFailedSubheading || 'Hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis.",
          heroImageUrl: resultPageConfig.heroImageUrl,
        };
      case allPassed:
        return {
          message: resultPageConfig.allPassedMessage || 'Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng.',
          subheading: resultPageConfig.allPassedSubheading || 'Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis.",
          heroImageUrl: resultPageConfig.heroImageUrl,
        };
      case passedSome:
      default:
        return {
          message: resultPageConfig.passedSomeMessage || 'Dưới đây là danh sách các học bổng bạn đủ điều kiện.',
          subheading: resultPageConfig.passedSomeSubheading || 'Dưới đây là danh sách các học bổng bạn đủ điều kiện',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis.",
          heroImageUrl: resultPageConfig.heroImageUrl,
        };
    }
  };

  const configMessages = getConfigMessages();
  const displayCTAText = cmsResultText || configMessages.ctaText;
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

  const pageBgClasses = 'bg-gradient-to-b from-[#C7E7FF] via-[#E8F6FF] to-[#FFFFFF]';
  const calloutText = allFailed
    ? 'Hiện tại bạn chưa đủ điều kiện. Đừng nản! Chọn Smart Profile Analysis để biết cách nâng hồ sơ và cải thiện điểm yếu.'
    : allPassed
    ? 'Bạn đang có lợi thế! Chọn học bổng bạn quan tâm để xem cơ hội và hướng dẫn nộp hồ sơ.'
    : 'Một số học bổng phù hợp với bạn. Hãy chọn học bổng bên dưới để xem điểm mạnh/điểm yếu và cách nâng hồ sơ.';

  const primaryCtaLabel = allFailed
    ? '⚡ Xem cách cải thiện hồ sơ'
    : allPassed
    ? '⚡ Xem phân tích chi tiết'
    : '⚡ Tiếp tục với Smart Profile Analysis';

  return (
    <motion.div
      className={`min-h-screen ${pageBgClasses} px-4 py-6 md:px-6 md:py-8 safe-area relative overflow-hidden font-sans`}
      style={{ fontFamily: "'Inter','Plus Jakarta Sans', system-ui, sans-serif" }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* subtle tech pattern overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(ellipse at top right, rgba(56,189,248,0.15), transparent 70%)',
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
            transition={{ duration: 0.2 }}
            className="relative group rounded-[16px] md:rounded-[20px] bg-white border-[1px] border-[#E0ECFF] shadow-[0_12px_40px_rgba(56,189,248,0.25)] p-4 md:p-5"
          >
            {/* subtle top accent bar */}
            <div className="absolute top-0 inset-x-4 h-[2px] bg-gradient-to-r from-[#00A8F0] to-[#0074E4] opacity-70 rounded-full pointer-events-none" aria-hidden="true" />

            <div className="flex items-start gap-3">
              {/* compact hero icon/logo */}
              {configMessages.heroImageUrl ? (
                <img
                  src={configMessages.heroImageUrl}
                  alt="Kết quả học bổng"
                  className="w-10 h-10 rounded-xl object-cover border border-[#E0ECFF] shadow-sm"
                />
              ) : (
                <div className="icon-chip w-10 h-10 text-base">🎓</div>
              )}

              {/* text block */}
              <div className="flex-1">
                <h2 className="text-base md:text-lg font-semibold text-[#0B2749] tracking-tight">{configMessages.subheading}</h2>
                <p className="mt-1.5 text-sm md:text-base text-[#405A7D] leading-snug">{configMessages.message}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Row B: Khung C (AI Analysis Box) */}
        <motion.div className="mt-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="max-w-6xl mx-auto">
            <div className="h-[6px] w-20 md:w-24 bg-gradient-to-r from-sky-400 to-blue-500 mx-auto rounded-full mb-3"></div>
            <div className="backdrop-blur-[2px] bg-white border-[1px] border-[#E0ECFF] rounded-[16px] md:rounded-[20px] shadow-[0_12px_40px_rgba(56,189,248,0.25)] p-5 md:p-6 text-center">
              <h3 className="text-xl md:text-2xl font-bold text-[#0B2749] mb-2">Phân tích sơ bộ hồ sơ của bạn</h3>
              <p className="text-sm md:text-base text-[#405A7D] leading-snug">
                {aiFeedback}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Câu hỏi dẫn hướng */}
        <motion.div className="mt-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="bg-gradient-to-r from-[#E0F7FA] to-white border border-[#06B6D4]/20 rounded-[16px] md:rounded-[20px] p-5">
            <div className="flex items-center text-lg font-semibold text-[#0B2749]">
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
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700';
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelectScholarship(s)}
                    className="group w-full app-card overflow-hidden p-5 md:p-5 sm:hover:shadow-md sm:hover:-translate-y-0.5 sm:hover:ring-1 sm:hover:ring-sky-300/50 transition-all focus:outline-none"
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
                        <div className="text-[14px] font-medium text-[#0B2749] tracking-tight">{s.name}</div>
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

        {/* Row E: CTA Buttons */}
        <motion.div className="mt-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="rounded-[16px] md:rounded-[20px] bg-white/90 backdrop-blur-[2px] shadow-inner p-3 mx-1">
            <div className="max-w-md mx-auto grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              <button onClick={handleCTAClick} className="cta-primary">
                <span className="text-[#FFFFFF]">⚡</span>
                <span className="text-sm">{primaryCtaLabel}</span>
              </button>
              <button
                onClick={() => window.history.back()}
                className="border border-[#E0ECFF] text-[#009CF2] bg-white rounded-2xl h-12 font-medium w-full hover:bg-[#E8F6FF]"
              >
                <span className="text-sm">Quay lại</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};