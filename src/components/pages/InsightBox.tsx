import React from 'react';
import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';

interface ConfigMessages {
  ctaText?: string;
}

interface InsightBoxProps {
  feedback: string;
  loading?: boolean;
  ctaText?: string; // kept for backward compatibility; not rendered here
  onCTAClick?: () => void; // kept for backward compatibility; not rendered here
  configMessages?: ConfigMessages;
}

/**
 * InsightBox (Analysis – Khung C)
 * - Prominent analysis card with top accent bar
 * - Larger typography and skeleton while loading
 */
export const InsightBox: React.FC<InsightBoxProps> = ({ feedback, loading, ctaText, onCTAClick, configMessages }) => {
  const title = t('ui.result.ai.title', 'Phân tích tổng quan từ AI');

  // Neutralize raw error messages
  const ERROR_NEUTRAL_MSG = t(
    'ui.result.ai.neutral',
    'Hiện chưa có nhận xét từ AI. Bạn có thể xem phân tích chi tiết sau.'
  );
  const isErrorFeedback = typeof feedback === 'string'
    && (feedback.trim().toLowerCase().startsWith('lỗi:')
      || feedback.trim().toLowerCase().startsWith('error'));
  const effectiveFeedback = isErrorFeedback ? ERROR_NEUTRAL_MSG : feedback;

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative"
    >
      <div className="rp-analysis">
        <div className="rp-analysis-header">
          <h2 className="text-[22px] md:text-[24px] font-bold tracking-[0.5px] text-[var(--rp-text)]">{title}</h2>
        </div>
        <div className="rounded-xl border border-[var(--rp-card-border)] bg-[var(--rp-section-tint)] p-4">
          {loading ? (
            <div>
              <div className="rp-skeleton-line" />
              <div className="rp-skeleton-line" />
              <div className="rp-skeleton-line" />
              <div className="rp-skeleton-line" />
            </div>
          ) : (
            <pre className="whitespace-pre-line text-[15px] md:text-[16px] leading-8 text-[#1B365D]">
              {effectiveFeedback || t('ui.result.ai.empty', 'Phân tích đang được cập nhật...')}
            </pre>
          )}
        </div>
      </div>
    </motion.section>
  );
};
