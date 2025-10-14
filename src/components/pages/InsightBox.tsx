import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { t } from '@/lib/i18n';

interface ConfigMessages { ctaText?: string }

interface InsightBoxProps {
  feedback: string;
  loading?: boolean;
  ctaText?: string; // unused in UI, kept for compat
  onCTAClick?: () => void; // unused in UI, kept for compat
  configMessages?: ConfigMessages;
  hideTitle?: boolean; // UI-only flag to embed under a custom section title
}

export const InsightBox: React.FC<InsightBoxProps> = ({ feedback, loading, hideTitle }) => {
  const title = t('ui.result.ai.title', 'Phân tích tổng quan từ AI');

  // Neutralize raw error messages
  const ERROR_NEUTRAL_MSG = t(
    'ui.result.ai.neutral',
    'Hiện chưa có nhận xét từ AI. Bạn có thể xem phân tích chi tiết sau.'
  );
  const isErrorFeedback = typeof feedback === 'string'
    && (feedback.trim().toLowerCase().startsWith('lỗi:')
      || feedback.trim().toLowerCase().startsWith('error'));
  const effectiveFeedback = isErrorFeedback ? ERROR_NEUTRAL_MSG : (feedback || '');

  // First sentence highlight (UI only)
  const findFirstSentence = (s: string): [string, string] => {
    const text = s.trim();
    if (!text) return ['', ''];
    const newlineIdx = text.indexOf('\n');
    if (newlineIdx > 0) return [text.slice(0, newlineIdx).trim(), text.slice(newlineIdx + 1).trim()];
    const m = text.match(/^(.{0,280}?[\.!?])(\s|$)/);
    if (m && m[1]) return [m[1].trim(), text.slice(m[1].length).trim()];
    if (text.length > 160) return [text.slice(0, 160).trim() + '…', text.slice(160).trim()];
    return [text, ''];
  };
  const [intro, rest] = findFirstSentence(effectiveFeedback);
  const restLines = rest ? rest.split(/\n+/).map(l => l.trim()).filter(Boolean) : [];

  // Build paragraphs for staged reveal
  const paragraphs = useMemo(() => {
    const arr: string[] = [];
    if (intro) arr.push(intro);
    arr.push(...restLines);
    return arr;
  }, [intro, restLines]);

  // Reveal paragraphs one-by-one when not loading
  const [visibleCount, setVisibleCount] = useState(0);
  useEffect(() => {
    if (loading) {
      setVisibleCount(0);
      return;
    }
    // Start with the first paragraph visible if any
    setVisibleCount(paragraphs.length > 0 ? 1 : 0);
    if (paragraphs.length <= 1) return;
    let i = 1;
    const interval = setInterval(() => {
      i += 1;
      setVisibleCount(v => {
        const next = Math.min(paragraphs.length, Math.max(v, i));
        if (next >= paragraphs.length) clearInterval(interval);
        return next;
      });
    }, 450); // 400–600ms per paragraph
    return () => clearInterval(interval);
  }, [loading, paragraphs.join('\n')]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative"
    >
      <div className={"AI-box bg-[rgba(255,255,255,0.95)] border border-[rgba(0,128,255,0.15)] md:border-[rgba(0,128,255,0.25)] shadow-[0_6px_16px_rgba(0,128,255,0.08)] md:shadow-[0_12px_32px_rgba(0,128,255,0.1)] rounded-lg md:rounded-2xl px-0 py-4 md:p-8 leading-relaxed transition-all duration-300 ease-in-out hover:-translate-y-[2px] md:hover:-translate-y-[3px] hover:shadow-[0_18px_36px_rgba(0,229,255,0.2)] -mx-[26px] sm:mx-0" + (hideTitle ? " ai-hide-title" : "") }>
        <h2 className="ai-title text-[16px] md:text-[20px] font-semibold tracking-wide mb-3 md:mb-4">Phân tích tổng quan</h2>

        <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="ai-thinking-stage h-28 md:h-32 rounded-xl overflow-hidden border border-blue-100 shadow-sm bg-white/80 relative">
              <div className="ai-thinking-wave-bg" />
              <div className="ai-thinking-wave-glow" />
            </div>

            <motion.p
              initial={{ opacity: 0, y: 2 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 2 }}
              transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
              className="mt-3 text-[13px] md:text-sm text-slate-500"
            >
              ⏳ Chờ chút nhé, Tùng đang phân tích hồ sơ của bạn...
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="ai-stream"
          >
            {paragraphs.length > 0 ? (
              <div className="space-y-2">
                {paragraphs.slice(0, visibleCount).map((p, idx) => (
                  <p
                    key={idx}
                    className={(idx === 0 ? 'ai-intro ' : '') + 'fade-in text-[#0D1B3D] font-normal'}
                    style={{ animationDelay: `${idx * 0.45}s` }}
                  >
                    {p}
                  </p>
                ))}
              </div>
            ) : (
              !intro && <p className="mb-2">{t('ui.result.ai.empty', 'Phân tích đang được cập nhật...')}</p>
            )}
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

