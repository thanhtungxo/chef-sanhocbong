import React, { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { ResultBanner } from './ResultBanner';
import { InsightBox } from './InsightBox';
import { ScholarshipGrid } from './ScholarshipGrid';
import { ResultCTA } from './ResultCTA';

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
}

interface ResultPageProps {
  userName: string;
  eligibilityResults: Scholarship[];
  cmsResultText?: string;
  messageType?: "fail_all" | "pass_all" | "pass_some";
  eligible?: boolean;
}

/**
 * ResultPage component displays scholarship eligibility results after completing the wizard
 * @param userName - Name of the user
 * @param eligibilityResults - Full list of scholarship eligibility results
 * @param cmsResultText - Text content managed by admin through CMS
 * @param messageType - Precomputed message type from the backend
 * @param eligible - Overall eligibility status from the backend
 */
export const ResultPage: React.FC<ResultPageProps> = ({  userName,  eligibilityResults = [],  cmsResultText, messageType, eligible }) => {
  // Get CMS configuration from the database
  const resultPageConfig = useQuery(api.resultPage.getResultPageConfig, {});
  
  // Calculate scenarios if not provided from backend
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
  
  // Filter only eligible scholarships for the grid
  const eligibleScholarships = useMemo(() => 
    eligibilityResults.filter(r => r.eligible), 
    [eligibilityResults]
  );
  
  // Prepare data for AI feedback
  const failedScholarships = useMemo(() => 
    eligibilityResults.filter(r => !r.eligible), 
    [eligibilityResults]
  );
  
  // Extract reasons text that handles both string and object formats
  const allReasonsText = useMemo(() => {
    const reasons = failedScholarships.flatMap(s => s.reasons || []);
    return reasons.map(reason => 
      typeof reason === 'string' ? reason : reason.message
    );
  }, [failedScholarships]);
  
  // Generate AI prompt based on CMS template
  const aiPromptTemplate = resultPageConfig?.aiPromptConfig || 
    `{{userName}} vừa hoàn thành wizard.\n\nCác học bổng pass: {{passedScholarships}}\nCác học bổng fail: {{failedScholarships}}\nLý do fail: {{reasons}}\n\nHãy viết feedback thân thiện, khích lệ, ngắn gọn 3–4 câu.`;
  
  const passedScholarshipNames = eligibleScholarships.map(s => s.name).join(', ');
  const failedScholarshipNames = failedScholarships.map(s => s.name).join(', ');
  const reasonsText = allReasonsText.length > 0 ? allReasonsText.join(', ') : "không có lý do fail, hồ sơ rất mạnh";
  
  // Replace placeholders in the prompt
  const finalPrompt = aiPromptTemplate
    .replace('{{userName}}', userName)
    .replace('{{passedScholarships}}', passedScholarshipNames)
    .replace('{{failedScholarships}}', failedScholarshipNames)
    .replace('{{reasons}}', reasonsText);
  
  // Mock AI feedback (in a real app, this would call an API)
  const aiFeedback = useMemo(() => {
    console.log("AI Prompt:", finalPrompt);
    
    // Simple mock feedback based on scenario
    if (allFailed) {
      return `Xin chào ${userName}, sau khi đánh giá hồ sơ của bạn, chúng tôi thấy bạn chưa đáp ứng đủ các yêu cầu cho các học bổng hiện tại. Đây là một cơ hội để bạn cải thiện hồ sơ. Hãy xem xét việc nâng cao trình độ tiếng Anh, tích lũy thêm kinh nghiệm làm việc hoặc bổ sung các dự án liên quan.`;
    } else if (allPassed) {
      return `Xin chào ${userName}, chúc mừng! Hồ sơ của bạn rất xuất sắc và đáp ứng đầy đủ các yêu cầu cho tất cả các học bổng. Đây là một bước đột phá trong hành trình học thuật của bạn. Hãy tiếp tục phát huy những ưu điểm này.`;
    } else {
      return `Xin chào ${userName}, sau khi đánh giá hồ sơ, chúng tôi thấy bạn đủ điều kiện cho một số học bổng. Đây là một kết quả tuyệt vời! Để cải thiện thêm, hãy tập trung vào các điểm yếu được chỉ ra để gia tăng cơ hội nhận học bổng.`;
    }
  }, [finalPrompt, userName, allFailed, allPassed]);
  
  // Get configuration messages based on scenario
  const getConfigMessages = () => {
    if (!resultPageConfig) {
      return {
        message: 'Dưới đây là kết quả đánh giá học bổng của bạn.',
        subheading: 'Kết quả đánh giá học bổng',
        fallbackMessage: "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
        ctaText: "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis."
      };
    }

    switch (true) {
      case allFailed:
        return {
          message: resultPageConfig.allFailedMessage || 'Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào.',
          subheading: resultPageConfig.allFailedSubheading || 'Hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis."
        };
      case allPassed:
        return {
          message: resultPageConfig.allPassedMessage || 'Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng.',
          subheading: resultPageConfig.allPassedSubheading || 'Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis."
        };
      case passedSome:
      default:
        return {
          message: resultPageConfig.passedSomeMessage || 'Dưới đây là danh sách các học bổng bạn đủ điều kiện.',
          subheading: resultPageConfig.passedSomeSubheading || 'Dưới đây là danh sách các học bổng bạn đủ điều kiện',
          fallbackMessage: resultPageConfig.fallbackMessage || "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.",
          ctaText: resultPageConfig.ctaText || "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis."
        };
    }
  };

  const configMessages = getConfigMessages();
  
  // Use CMS text if available, otherwise fall back to default
  const displayCTAText = cmsResultText || configMessages.ctaText;
    
  // Use CMS fallback message if available, otherwise fall back to default
  const displayFallbackMessage = configMessages.fallbackMessage;

  // Handle navigation to Layer 2 (Smart Profile Analysis)
  const handleNavigateToLayer2 = (scholarship: Scholarship) => {
    console.log("TODO: Navigate to Layer 2 - Smart Profile Analysis", { scholarship });
    // In a real application, this would navigate to the next step
    alert('Chuyển đến Layer 2 - Smart Profile Analysis (tính năng đang phát triển)');
  };
  
  // Handle CTA click (no specific scholarship)
  const handleCTAClick = () => {
    console.log("TODO: Navigate to Layer 2 from CTA");
    // In a real application, this would navigate to the next step
    alert('Chuyển đến Layer 2 - Smart Profile Analysis (tính năng đang phát triển)');
  };
  
  // Handle navigation back to homepage
  const handleNavigateToHome = () => {
    console.log("Navigate back to homepage");
    // In a real application, this would navigate back to the home page
    window.location.href = '/';
  };
  
  return (
    <div className="result-page container mx-auto px-4 py-8">
      <ResultBanner 
        userName={userName}
        allFailed={allFailed}
        allPassed={allPassed}
        passedSome={passedSome}
        configMessages={{ subheading: configMessages.subheading }}
      />
      
      <div className="mt-8">
        <InsightBox
            feedback={aiFeedback}
            ctaText={displayCTAText}
            onCTAClick={handleCTAClick}
            configMessages={configMessages}
          />
      </div>
      
      {/* Use the backend's eligible status if available, otherwise fall back to our calculation */}
      {typeof eligible === 'boolean' ? (
        eligible ? (
          <div className="mt-12">
            <ScholarshipGrid 
              scholarships={eligibleScholarships}
              onScholarshipClick={handleNavigateToLayer2}
            />
          </div>
        ) : (
          <div className="mt-12 text-center">
            <p className="text-gray-600 text-lg">{displayFallbackMessage}</p>
          </div>
        )
      ) : eligibleScholarships.length > 0 ? (
        <div className="mt-12">
          <ScholarshipGrid 
            scholarships={eligibleScholarships}
            onScholarshipClick={handleNavigateToLayer2}
          />
        </div>
      ) : (
        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg">{displayFallbackMessage}</p>
        </div>
      )}
      
      <div className="mt-12">
        <ResultCTA 
          eligibleScholarships={eligibleScholarships}
          onCTAClick={handleCTAClick}
        />
      </div>
      
      {/* Back to Home button */}
      <div className="mt-8 text-center">
        <button 
          className="text-blue-600 hover:text-blue-800 font-medium"
          onClick={handleNavigateToHome}
        >
          Quay về Trang chủ
        </button>
      </div>
    </div>
  );
};