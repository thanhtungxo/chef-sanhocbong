import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/i18n';

// Define the Scholarship interface
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

interface ScholarshipGridProps {
  scholarships: Scholarship[];
  onScholarshipClick: (scholarship: Scholarship) => void;
  fallbackMessage?: string;
}

/**
 * Generate a fallback avatar with 2-3 characters from the scholarship name
 * @param name - Scholarship name
 * @returns Abbreviation of the scholarship name
 */
const generateFallbackAvatar = (name: string): string => {
  const words = name.split(/\s+/);
  let abbreviation = '';
  if (words.length === 1) {
    abbreviation = name.substring(0, 3).toUpperCase();
  } else {
    abbreviation = words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 3);
  }
  return abbreviation;
};

/**
 * Format the scholarship reasons into a readable string
 */
const formatReasons = (reasons?: Reason[]): string => {
  if (!reasons || reasons.length === 0) return '';
  const reasonTexts = reasons.map(reason => typeof reason === 'string' ? reason : reason.message);
  return reasonTexts.join('\n');
};

const containerVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.08,
      when: 'beforeChildren',
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0 },
};

export const ScholarshipGrid: React.FC<ScholarshipGridProps> = ({ 
  scholarships, 
  onScholarshipClick,
  fallbackMessage = t('ui.result.grid.empty', 'Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.')
}) => {
  const eligibleScholarships = scholarships.filter(s => s.eligible);

  if (!eligibleScholarships || eligibleScholarships.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-gray-600 dark:text-gray-300 text-lg">{fallbackMessage}</p>
      </div>
    );
  }
  
  return (
    <motion.section
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="mx-auto max-w-6xl px-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {eligibleScholarships.map((scholarship) => {
          const fallbackAvatar = generateFallbackAvatar(scholarship.name);
          const reasonsText = formatReasons(scholarship.reasons);
          const lower = scholarship.name.toLowerCase();
          const icon = lower.includes('aas') ? '🇦🇺' : lower.includes('chevening') ? '🎓' : '🎖️';
          const eligibleBadgeText = t('ui.results.badge.eligible', 'Eligible ✅');
          const eligibleSubtext = t('ui.results.subtext.eligible', '🎓 Đủ điều kiện');

          return (
            <motion.div key={scholarship.id} variants={itemVariants} whileHover={{ scale: 1.02 }}>
              <Card
                className="relative overflow-hidden border border-gray-200/70 dark:border-gray-700 bg-white/90 dark:bg-gray-900/60 shadow-sm hover:shadow-xl transition-all duration-200"
                onClick={() => onScholarshipClick(scholarship)}
              >
                <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-center relative">
                  <div className="absolute top-3 right-3">
                    <Badge className="rounded-full bg-green-100 text-green-700 shadow px-2 py-1 text-xs">
                      {eligibleBadgeText}
                    </Badge>
                  </div>
                  <div className="w-20 h-20 bg-white text-blue-800 rounded-full flex items-center justify-center text-xl font-bold mx-auto shadow">
                    {fallbackAvatar}
                  </div>
                  <div className="mt-3 text-white text-sm font-medium flex items-center justify-center gap-2">
                    <span className="text-lg" aria-hidden="true">{icon}</span>
                    <span>{eligibleSubtext}</span>
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-2">{scholarship.name}</h3>
                  {scholarship.description && (
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">{scholarship.description}</p>
                  )}

                  <div className="space-y-2 text-sm">
                    {scholarship.amount && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="w-28 font-medium">{t('ui.results.amount', 'Mức học bổng:')}</span>
                        <span>{scholarship.amount}</span>
                      </div>
                    )}
                    {scholarship.deadline && (
                      <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <span className="w-28 font-medium">{t('ui.results.deadline', 'Hạn nộp:')}</span>
                        <span>{scholarship.deadline}</span>
                      </div>
                    )}
                  </div>

                  {reasonsText && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-sm text-gray-700 dark:text-gray-200">
                      <div className="font-medium mb-1">{t('ui.results.reasonsTitle', 'Lý do đủ điều kiện:')}</div>
                      <pre className="whitespace-pre-line text-xs">{reasonsText}</pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
};