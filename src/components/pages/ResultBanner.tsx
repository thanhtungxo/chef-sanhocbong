import React from 'react';

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
  const getSubheading = () => {
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

  return (
    <div className="bg-white/80 dark:bg-gray-900/60 rounded-2xl border shadow-lg p-8 text-center">
      <div className="text-5xl mb-4 animate-pulse">🎉</div>
      <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Chúc mừng bạn đã hoàn thành bước đầu tiên!</h1>
      <p className="text-gray-600 dark:text-gray-300 text-lg">
        {getSubheading()}
      </p>
    </div>
  );
};