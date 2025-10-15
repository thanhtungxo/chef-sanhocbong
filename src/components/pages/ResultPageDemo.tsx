import React from 'react';
import { ResultPage } from './ResultPage';
import { ResultPageTest } from './ResultPageTest';
import { ReasonFormatTest } from './ReasonFormatTest';
import { allFailedScenario, allPassedScenario, passedSomeScenario } from './mockData';

/**
 * Demo component to showcase ResultPage with different scenarios
 * This helps verify our implementation without requiring tests to run
 */
export const ResultPageDemo: React.FC = () => {
  const [scenario, setScenario] = React.useState<'allFailed' | 'allPassed' | 'passedSome'>('passedSome');
  const [showTest, setShowTest] = React.useState<'main' | 'mixedReasons'>('main');
  
  const getCurrentScenario = () => {
    switch (scenario) {
      case 'allFailed':
        return allFailedScenario;
      case 'allPassed':
        return allPassedScenario;
      case 'passedSome':
        return passedSomeScenario;
      default:
        return passedSomeScenario;
    }
  };
  
  const currentScenario = getCurrentScenario();
  
  return (
    // Wrapper chính cho toàn bộ trang demo
    // - Trên mobile (<768px): padding p-4
    // - Trên desktop (>=768px): có nền gradient và padding lớn hơn để khung hiển thị đẹp mắt
    <div className="min-h-screen w-full bg-white md:bg-gradient-to-b md:from-gray-50 md:to-gray-100 p-4 md:p-8">
      {/* Container cho nội dung, căn giữa trên desktop */}
      {/* - Trên desktop: max-w-5xl, mx-auto */}
      <div className="max-w-5xl mx-auto">
        {!showTest ? (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">ResultPage Scenario Demo</h1>
            
            {/* Scenario selector */}
            <div className="mb-8 flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setScenario('allFailed')}
                className={`px-4 py-2 rounded-lg ${scenario === 'allFailed' ? 'bg-red-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Tất cả không đủ điều kiện
              </button>
              <button
                onClick={() => setScenario('allPassed')}
                className={`px-4 py-2 rounded-lg ${scenario === 'allPassed' ? 'bg-green-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Tất cả đủ điều kiện
              </button>
              <button
                onClick={() => setScenario('passedSome')}
                className={`px-4 py-2 rounded-lg ${scenario === 'passedSome' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 border border-gray-300'}`}
              >
                Một phần đủ điều kiện
              </button>
              <button
                onClick={() => setShowTest('main')}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white"
              >
                Demo chính
              </button>
              <button
                onClick={() => setShowTest('mixedReasons')}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white"
              >
                Kiểm tra định dạng reasons hỗn hợp
              </button>
            </div>
        
        {/* Current scenario info */}
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <h3 className="font-semibold text-gray-700">Thông tin kịch bản:</h3>
          <ul className="mt-2 space-y-1 text-sm text-gray-600">
            <li><span className="font-medium">Tên người dùng:</span> {currentScenario.userName}</li>
            <li><span className="font-medium">Số lượng học bổng:</span> {currentScenario.eligibilityResults.length}</li>
            <li><span className="font-medium">Số lượng đủ điều kiện:</span> {currentScenario.eligibilityResults.filter(s => s.eligible).length}</li>
            <li><span className="font-medium">Số lượng không đủ điều kiện:</span> {currentScenario.eligibilityResults.filter(s => !s.eligible).length}</li>
          </ul>
        </div>
        
        {/* Wrapper cho ResultPage component */}
        {/* - Trên mobile: không có style, nội dung sẽ tràn lề */}
        {/* - Trên desktop: có nền trắng, bo góc, đổ bóng và padding lớn */}
        <div className="md:bg-white md:rounded-3xl md:shadow-2xl md:p-10">
          {/* Các component con bên trong ResultPage sẽ dùng space-y để tạo khoảng cách */}
          {/* Ví dụ: <div className="space-y-6 md:space-y-10">...</div> */}
          {showTest === 'mixedReasons' ? (
            <ReasonFormatTest />
          ) : (
            <ResultPage 
              eligibilityResults={currentScenario.eligibilityResults}
              userName={currentScenario.userName}
            />
          )}
        </div>
        
        {/* Implementation notes */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-700 mb-2">Ghi chú triển khai:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
            <li>ResultPage hiện hỗ trợ 3 kịch bản chính: tất cả thất bại, tất cả thành công, một phần thành công</li>
            <li>Các thông báo, tiêu đề phụ và văn bản CTA được lấy từ cấu hình CMS</li>
            <li>Thông tin người dùng được đưa vào tiêu đề phụ để cá nhân hóa trải nghiệm</li>
            <li>Thẻ học bổng đã được nâng cấp để hiển thị mô tả, hạn chót và giá trị học bổng</li>
            <li>Đã thêm hỗ trợ lịch sử phiên bản trong trang cấu hình ResultPage</li>
            <li>Hỗ trợ cả định dạng chuỗi (string) và đối tượng (object) cho trường reasons:</li>
            <ul className="list-circle pl-5 mt-1">
              <li>Đối với chuỗi: Hiển thị trực tiếp nội dung chuỗi</li>
              <li>Đối với đối tượng: Truy xuất và hiển thị trường message</li>
            </ul>
          </ul>
        </div>
      </>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Kiểm tra hỗ trợ định dạng reasons</h1>
            <button 
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 mb-8"
              onClick={() => setShowTest('main')}
            >
              Quay lại kịch bản chính
            </button>
            <ResultPageTest />
          </>
        )}
      </div>
    </div>
  );
};

export default ResultPageDemo;