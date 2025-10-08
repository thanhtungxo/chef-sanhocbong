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
            className="w-full sm:w-auto bg-[rgb(var(--hb-blue))] hover:bg-[rgb(var(--hb-blue-700))] text-white py-3 px-7 rounded-full transition-all duration-300 shadow-[0_10px_20px_rgba(50,176,255,0.25)] hover:shadow-[0_12px_24px_rgba(11,39,73,0.25)] transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--hb-blue))] dark:focus-visible:ring-offset-gray-900"
            onClick={handleContinue}
          >
            {primaryLabel}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto bg-white text-[rgb(var(--hb-dark))] border border-[rgba(0,0,0,0.08)] hover:bg-[rgb(var(--hb-blue-50))] py-3 px-7 rounded-full transition-all duration-200"
            onClick={() => (window.location.href = '/')}
          >
            {secondaryLabel}
          </motion.button>
        </>
      ) : (
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          className="w-full sm:w-auto bg-[rgb(var(--hb-blue))] hover:bg-[rgb(var(--hb-blue-700))] text-white py-3 px-7 rounded-full transition-all duration-300 shadow-[0_10px_20px_rgba(50,176,255,0.25)] hover:shadow-[0_12px_24px_rgba(11,39,73,0.25)] transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[rgb(var(--hb-blue))] dark:focus-visible:ring-offset-gray-900"
          onClick={() => (window.location.href = '/')}
        >
          {backToHomeLabel}
        </motion.button>
      )}
    </motion.div>
  );
};
