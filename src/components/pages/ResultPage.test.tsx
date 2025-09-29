import React from 'react';
import { render, screen } from '@testing-library/react';
import { ResultPage } from './ResultPage';
import { allFailedScenario, allPassedScenario, passedSomeScenario } from './mockData';

// Mock the useQuery and useMutation hooks
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(() => jest.fn()),
  useConvexAuth: jest.fn(() => ({ isAuthenticated: false }))
}));

// Mock useRouter
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn()
  }))
}));

// Mock React AI SDK components
jest.mock('ai/react', () => ({
  useChat: jest.fn(() => ({
    messages: [],
    input: '',
    handleInputChange: jest.fn(),
    handleSubmit: jest.fn(),
    isLoading: false
  }))
}));

describe('ResultPage', () => {
  // Mock config data for the ResultPage
  const mockConfig = {
    ctaText: 'Tiếp tục',
    allFailedMessage: 'Rất tiếc, bạn hiện không đủ điều kiện cho bất kỳ học bổng nào.',
    allPassedMessage: 'Chúc mừng! Bạn đủ điều kiện cho tất cả học bổng.',
    passedSomeMessage: 'Dưới đây là kết quả đánh giá khả năng đủ điều kiện của bạn.',
    allFailedSubheading: 'Hãy xem xét cải thiện một số điều kiện sau',
    allPassedSubheading: 'Bạn có thể bắt đầu chuẩn bị hồ sơ ngay bây giờ',
    passedSomeSubheading: 'Hãy chọn học bổng phù hợp nhất với bạn'
  };

  beforeEach(() => {
    // Mock the useQuery to return our mock config
    const { useQuery } = require('convex/react');
    useQuery.mockImplementation(() => mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('All Failed Scenario', () => {
    it('should render all failed message and subheading correctly', () => {
      render(<ResultPage eligibilityResults={allFailedScenario.eligibilityResults} userName={allFailedScenario.userName} />);
      
      expect(screen.getByText(mockConfig.allFailedMessage)).toBeInTheDocument();
      expect(screen.getByText(`${mockConfig.allFailedSubheading}, ${allFailedScenario.userName}`)).toBeInTheDocument();
    });

    it('should display all scholarships as ineligible', () => {
      render(<ResultPage eligibilityResults={allFailedScenario.eligibilityResults} userName={allFailedScenario.userName} />);
      
      const ineligibleBadges = screen.getAllByText('Không đủ điều kiện');
      expect(ineligibleBadges).toHaveLength(allFailedScenario.eligibilityResults.length);
    });
  });

  describe('All Passed Scenario', () => {
    it('should render all passed message and subheading correctly', () => {
      render(<ResultPage eligibilityResults={allPassedScenario.eligibilityResults} userName={allPassedScenario.userName} />);
      
      expect(screen.getByText(mockConfig.allPassedMessage)).toBeInTheDocument();
      expect(screen.getByText(`${mockConfig.allPassedSubheading}, ${allPassedScenario.userName}`)).toBeInTheDocument();
    });

    it('should display all scholarships as eligible', () => {
      render(<ResultPage eligibilityResults={allPassedScenario.eligibilityResults} userName={allPassedScenario.userName} />);
      
      const eligibleBadges = screen.getAllByText('Đủ điều kiện');
      expect(eligibleBadges).toHaveLength(allPassedScenario.eligibilityResults.length);
    });
  });

  describe('Passed Some Scenario', () => {
    it('should render passed some message and subheading correctly', () => {
      render(<ResultPage eligibilityResults={passedSomeScenario.eligibilityResults} userName={passedSomeScenario.userName} />);
      
      expect(screen.getByText(mockConfig.passedSomeMessage)).toBeInTheDocument();
      expect(screen.getByText(`${mockConfig.passedSomeSubheading}, ${passedSomeScenario.userName}`)).toBeInTheDocument();
    });

    it('should display both eligible and ineligible scholarships', () => {
      render(<ResultPage eligibilityResults={passedSomeScenario.eligibilityResults} userName={passedSomeScenario.userName} />);
      
      const eligibleBadges = screen.getAllByText('Đủ điều kiện');
      const ineligibleBadges = screen.getAllByText('Không đủ điều kiện');
      
      const eligibleCount = passedSomeScenario.eligibilityResults.filter(s => s.eligible).length;
      const ineligibleCount = passedSomeScenario.eligibilityResults.filter(s => !s.eligible).length;
      
      expect(eligibleBadges).toHaveLength(eligibleCount);
      expect(ineligibleBadges).toHaveLength(ineligibleCount);
    });
  });

  describe('Scholarship Details', () => {
    it('should display scholarship details including description, deadline, and amount', () => {
      render(<ResultPage eligibilityResults={passedSomeScenario.eligibilityResults} userName={passedSomeScenario.userName} />);
      
      // Check if key details are displayed
      passedSomeScenario.eligibilityResults.forEach(scholarship => {
        if (scholarship.description) {
          expect(screen.getByText(scholarship.description)).toBeInTheDocument();
        }
        if (scholarship.deadline) {
          expect(screen.getByText(`Hạn nộp: ${scholarship.deadline}`)).toBeInTheDocument();
        }
        if (scholarship.amount) {
          expect(screen.getByText(`Giá trị: ${scholarship.amount}`)).toBeInTheDocument();
        }
      });
    });
  });
});