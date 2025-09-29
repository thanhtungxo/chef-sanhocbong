import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * ResultPageConfig component allows administrators to manage content for the ResultPage
 * @remarks This component is used in the Admin Dashboard under the 'Result' tab
 */
export const ResultPageConfig: React.FC = () => {
  // Fetch the current result page configuration from the database
  const resultPageConfig = useQuery(api.resultPage.getResultPageConfig, {});
  
  // Mutation to update the result page configuration
  const updateConfig = useMutation(api.resultPage.updateResultPageConfig);
  
  // Local state for form inputs
  const [ctaText, setCtaText] = useState<string>('');
  const [aiPromptConfig, setAiPromptConfig] = useState<string>('');
  const [fallbackMessage, setFallbackMessage] = useState<string>('');
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Default values if no config exists
  const defaultCTAText = "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis.";
  const defaultFallbackMessage = "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.";
  
  // Load configuration data when it becomes available
  useEffect(() => {
    if (resultPageConfig) {
      setCtaText(resultPageConfig.ctaText || defaultCTAText);
      setAiPromptConfig(resultPageConfig.aiPromptConfig || '');
      setFallbackMessage(resultPageConfig.fallbackMessage || defaultFallbackMessage);
    } else {
      // If no config exists, use default values
      setCtaText(defaultCTAText);
      setFallbackMessage(defaultFallbackMessage);
    }
  }, [resultPageConfig]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Update the configuration in the database
      await updateConfig({
        ctaText,
        aiPromptConfig,
        fallbackMessage,
      });
      
      // Show success message
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
      
    } catch (err) {
      // Handle errors
      console.error('Failed to update result page configuration:', err);
      setError('Cập nhật không thành công. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };
  
  if (resultPageConfig === undefined) {
    // Show loading state while fetching data
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-8 w-40" /></CardTitle>
          <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-40 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quản lý nội dung trang Kết quả</CardTitle>
        <CardDescription>Cấu hình các thông báo và nội dung hiển thị trên trang Kết quả sau khi ứng viên hoàn thành Wizard</CardDescription>
      </CardHeader>
      
      {error && (
        <Alert variant="destructive" className="mx-6 -mt-4 mb-6">
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mx-6 -mt-4 mb-6">
          <AlertTitle>Thành công</AlertTitle>
          <AlertDescription>Cập nhật nội dung thành công!</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          {/* CTA Text Configuration */}
          <div className="space-y-2">
            <Label htmlFor="ctaText">CTA Text (B.2 - dưới Insight Box)</Label>
            <textarea
              id="ctaText"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="Nhập văn bản kêu gọi người dùng tiếp tục vào Layer 2"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Văn bản này sẽ hiển thị dưới hộp phân tích AI, kêu gọi người dùng tiếp tục với Smart Profile Analysis.
            </p>
          </div>
          
          {/* AI Prompt Configuration */}
          <div className="space-y-2">
            <Label htmlFor="aiPromptConfig">AI Prompt Configuration (tạm)</Label>
            <textarea
              id="aiPromptConfig"
              value={aiPromptConfig}
              onChange={(e) => setAiPromptConfig(e.target.value)}
              placeholder="Cấu hình prompt cho AI (tính năng đang phát triển)"
              className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Cấu hình này sẽ được sử dụng cho hệ thống AI để tạo phản hồi tùy chỉnh dựa trên hồ sơ người dùng (tính năng đang phát triển).
            </p>
          </div>
          
          {/* Fallback Message Configuration */}
          <div className="space-y-2">
            <Label htmlFor="fallbackMessage">Fallback Message (khi không đủ điều kiện học bổng)</Label>
            <textarea
              id="fallbackMessage"
              value={fallbackMessage}
              onChange={(e) => setFallbackMessage(e.target.value)}
              placeholder="Nhập thông báo khi người dùng không đủ điều kiện cho bất kỳ học bổng nào"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p className="text-sm text-muted-foreground">
              Văn bản này sẽ hiển thị khi người dùng không đủ điều kiện cho bất kỳ học bổng nào.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="justify-between">
          <div className="text-sm text-muted-foreground">
            Lưu ý: Thay đổi sẽ được áp dụng ngay lập tức trên trang Kết quả.
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};