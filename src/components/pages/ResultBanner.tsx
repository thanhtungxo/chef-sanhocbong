import React from 'react';
import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';

interface ConfigMessages {
  subheading: string;
}

interface ResultBannerProps {
  userName: string;
  allFailed: boolean;
  allPassed: boolean;
  passedSome: boolean;
  configMessages?: ConfigMessages;
}

export const ResultBanner: React.FC<ResultBannerProps> = ({ 
  userName, 
  allFailed, 
  allPassed, 
  passedSome,
  configMessages
}) => {
  // Determine the appropriate subheading based on the scenario and CMS configuration
  const getDynamicSubheading = () => {
    // Use CMS configured subheading if available
    if (configMessages?.subheading) {
      return configMessages.subheading.replace('{userName}', userName);
    }

    // Fallback to default messages
    if (allFailed) {
      return `Rất tiếc, ${userName} chưa đủ điều kiện để apply học bổng nào. Hãy tham khảo thêm để cải thiện hồ sơ.`;
    } else if (allPassed) {
      return `Tuyệt vời, ${userName} đã đủ điều kiện để apply tất cả học bổng bên dưới.`;
    } else if (passedSome) {
      return `Chúc mừng, ${userName} đã đủ điều kiện để apply một số học bổng sau:`;
    }
    return '';
  };

  const heading = t('ui.result.hero.heading', '🎉 Chúc mừng bạn đã hoàn thành bước đầu tiên!');
  const subheading = t('ui.result.hero.subheading', 'Kết quả đánh giá học bổng');

  return (
    <motion.section
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <div className="relative mx-auto max-w-5xl px-4">
        {/* Gradient banner card */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5]" aria-hidden="true" />
          {/* subtle decorative gradient rings */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" aria-hidden="true" />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" aria-hidden="true" />

          <div className="relative p-10 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
              {heading}
            </h1>
            <p className="mt-2 text-white/80 text-base sm:text-lg">
              {subheading}
            </p>
            <p className="mt-4 text-white text-sm sm:text-base opacity-95">
              {getDynamicSubheading()}
            </p>
            {/* subtle bottom card to separate from background */}
            <div className="mt-6 mx-auto max-w-md bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-white/90">
              <p className="text-sm">{t('ui.result.hero.helper', 'Bạn có thể xem chi tiết học bổng phù hợp bên dưới.')}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};