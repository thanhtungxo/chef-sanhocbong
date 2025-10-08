import React from 'react';
import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';

interface ConfigMessages {
  ctaText?: string;
}

interface InsightBoxProps {
  feedback: string;
  ctaText: string;
  onCTAClick: () => void;
  configMessages?: ConfigMessages;
}

/**
 * InsightBox component displays the AI feedback section
 * with a card containing the feedback and a call-to-action text
 */
export const InsightBox: React.FC<InsightBoxProps> = ({ feedback, ctaText, onCTAClick, configMessages }) => {
  const displayCTAText = configMessages?.ctaText || ctaText;
  const title = t('ui.result.ai.title', 'Phân tích tổng quan của Tùng về hồ sơ của bạn');

  // Typing animation for the first 2 seconds
  const [showTyping, setShowTyping] = React.useState(true);
  React.useEffect(() => {
    const timer = setTimeout(() => setShowTyping(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      <div className="relative mx-auto max-w-5xl px-4">
        <div className="relative bg-white/95 dark:from-gray-800 dark:to-gray-700 border border-[rgba(0,0,0,0.06)] dark:border-gray-700 rounded-2xl p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex items-start gap-4">
            {/* AI Avatar */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-[rgb(var(--hb-blue))] to-[rgb(var(--hb-dark))] shadow-md flex items-center justify-center text-white text-xl">
              🤖
            </div>
            {/* Text bubble */}
            <div className="flex-1">
              <h2 className="serif-title text-lg font-semibold text-[rgb(var(--hb-dark))] dark:text-blue-200 mb-1">{title}</h2>
              <div className="relative">
                <div className="rounded-xl bg-[rgb(var(--hb-blue-50))]/60 dark:bg-gray-900/50 border border-[rgba(0,0,0,0.05)] dark:border-gray-700 p-4 text-gray-700 dark:text-gray-200">
                  {showTyping ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="flex items-center gap-2 text-sm text-gray-500"
                    >
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="ml-2">Đang tạo nhận xét...</span>
                    </motion.div>
                  ) : (
                    <pre className="whitespace-pre-line text-sm sm:text-base leading-relaxed">{feedback || t('ui.result.ai.empty', 'AI feedback sẽ hiển thị ở đây')}</pre>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  className="w-full sm:w-auto bg-[rgb(var(--hb-blue))] hover:bg-[rgb(var(--hb-blue-700))] text-white py-3 px-6 rounded-full transition-all duration-300 shadow-[0_10px_20px_rgba(50,176,255,0.25)] hover:shadow-[0_12px_24px_rgba(11,39,73,0.25)] transform hover:-translate-y-0.5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--hb-blue))] dark:focus-visible:ring-offset-gray-900"
                  onClick={onCTAClick}
                >
                  {displayCTAText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
