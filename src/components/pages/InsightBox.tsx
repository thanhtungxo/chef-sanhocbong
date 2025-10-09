import React from 'react';
import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';

interface ConfigMessages { ctaText?: string }

interface InsightBoxProps {
  feedback: string;
  loading?: boolean;
  ctaText?: string; // unused in UI, kept for compat
  onCTAClick?: () => void; // unused in UI, kept for compat
  configMessages?: ConfigMessages;
}

export const InsightBox: React.FC<InsightBoxProps> = ({ feedback, loading }) => {
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

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative"
    >
      <div className="AI-box bg-[rgba(255,255,255,0.95)] border border-[rgba(0,128,255,0.25)] shadow-[0_12px_32px_rgba(0,128,255,0.1)] rounded-2xl p-6 md:p-8 leading-relaxed transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_18px_36px_rgba(0,229,255,0.2)]">
        <h2 className="ai-title text-[20px] font-semibold tracking-wide mb-4">{title}</h2>

        {loading ? (
          <div>
            <div className="rp-skeleton-line" />
            <div className="rp-skeleton-line" />
            <div className="rp-skeleton-line" />
            <div className="rp-skeleton-line" />
          </div>
        ) : (
          <div className="ai-stream">
            {intro && <p className="ai-intro mb-2">{intro}</p>}
            {restLines.length > 0 ? (
              restLines.map((line, idx) => (
                <p key={idx} className="mb-2">{line}</p>
              ))
            ) : (
              !intro && <p className="mb-2">{t('ui.result.ai.empty', 'Phân tích đang được cập nhật...')}</p>
            )}
          </div>
        )}
      </div>
    </motion.section>
  );
};

