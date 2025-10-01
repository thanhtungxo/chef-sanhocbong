import React from 'react';
import { motion } from 'framer-motion';
import { t } from '@/lib/i18n';

interface ReasonObject {
  message: string;
}

type Reason = string | ReasonObject;

interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons?: Reason[];
  description?: string;
  deadline?: string;
  amount?: string;
}

interface ResultCTAProps {
  eligibleScholarships: Scholarship[];
  onCTAClick: (scholarship?: Scholarship) => void;
}

export const ResultCTA: React.FC<ResultCTAProps> = ({ eligibleScholarships, onCTAClick }) => {
  const hasEligibleScholarships = eligibleScholarships && eligibleScholarships.length > 0;

  const primaryLabel = t('ui.result.cta.primary', '⚡ Tiếp tục với Smart Profile Analysis');
  const secondaryLabel = t('ui.prev', 'Quay lại');
  const backToHomeLabel = t('ui.backHome', 'Quay về Trang chủ');

  const handleContinue = () => onCTAClick(hasEligibleScholarships ? eligibleScholarships[0] : undefined);

  return (
    <motion.div
      className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8 px-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {hasEligibleScholarships ? (
        <>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] hover:from-[#04c6f4] hover:to-[#3f7ee0] text-white py-3 px-6 rounded-lg transition-all duration-300 shadow hover:shadow-xl transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff] dark:focus-visible:ring-offset-gray-900"
            onClick={handleContinue}
          >
            {primaryLabel}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 py-3 px-6 rounded-lg transition-all duration-200"
            onClick={() => (window.location.href = '/')}
          >
            {secondaryLabel}
          </motion.button>
        </>
      ) : (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto bg-gradient-to-r from-[#00d2ff] to-[#3a7bd5] hover:from-[#04c6f4] hover:to-[#3f7ee0] text-white py-3 px-6 rounded-lg transition-all duration-300 shadow hover:shadow-xl transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00d2ff] dark:focus-visible:ring-offset-gray-900"
          onClick={() => (window.location.href = '/')}
        >
          {backToHomeLabel}
        </motion.button>
      )}
    </motion.div>
  );
};