// Mock data for testing different ResultPage scenarios

interface Scholarship {
  id: string;
  name: string;
  eligible: boolean;
  reasons?: string[];
  description?: string;
  deadline?: string;
  amount?: string;
}

// Sample scholarships data
const sampleScholarships: Scholarship[] = [
  {
    id: 's1',
    name: 'Học bổng Chính phủ Australia Awards',
    eligible: true,
    reasons: ['Đạt yêu cầu về điểm IELTS', 'Có kinh nghiệm làm việc'],
    description: 'Học bổng dành cho sinh viên ưu tú muốn theo học ở Australia',
    deadline: '30/09/2023',
    amount: 'Toàn phần học phí + trợ cấp sinh hoạt'
  },
  {
    id: 's2',
    name: 'Học bổng Chevening',
    eligible: true,
    reasons: ['Đạt yêu cầu về trình độ học vấn', 'Có kế hoạch phát triển事業'],
    description: 'Học bổng do Chính phủ Anh tài trợ dành cho sinh viên quốc tế',
    deadline: '15/11/2023',
    amount: 'Toàn phần học phí + trợ cấp sinh hoạt'
  },
  {
    id: 's3',
    name: 'Học bổng Fulbright',
    eligible: false,
    reasons: ['Chưa đạt yêu cầu về điểm GRE', 'Hạn chế về chuyên ngành'],
    description: 'Học bổng dành cho sinh viên Việt Nam muốn theo học tại Mỹ',
    deadline: '10/12/2023',
    amount: 'Toàn phần học phí + trợ cấp sinh hoạt'
  },
  {
    id: 's4',
    name: 'Học bổng Erasmus+',
    eligible: false,
    reasons: ['Chưa đạt yêu cầu về tuổi tác', 'Chưa có kinh nghiệm nghiên cứu'],
    description: 'Chương trình trao đổi sinh viên châu Âu',
    deadline: '20/10/2023',
    amount: 'Trợ cấp du lịch + sinh hoạt'
  }
];

// Scenario 1: All failed scholarships
export const allFailedScenario = {
  userName: 'Thảo',
  eligibilityResults: sampleScholarships.map(s => ({ ...s, eligible: false }))
};

// Scenario 2: All passed scholarships
export const allPassedScenario = {
  userName: 'Huy',
  eligibilityResults: sampleScholarships.map(s => ({ ...s, eligible: true }))
};

// Scenario 3: Passed some scholarships
export const passedSomeScenario = {
  userName: 'Tùng',
  eligibilityResults: sampleScholarships
};

// Default mock data for general testing
export const defaultMockData = passedSomeScenario;