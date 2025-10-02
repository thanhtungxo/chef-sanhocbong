import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

/**
 * ResultPageConfig component allows administrators to manage content for the ResultPage
 * @remarks This component is used in the Admin Dashboard under the 'Result' tab
 */
export const ResultPageConfig: React.FC = () => {
  // Fetch the current result page configuration from the database
  const resultPageConfig = useQuery(api.resultPage.getResultPageConfig, {});
  // Fetch version history
  const versionHistory = useQuery(api.resultPage.listResultPageConfigs, {});
  
  // Mutation to update the result page configuration
  const updateConfig = useMutation(api.resultPage.updateResultPageConfig);
  
  // Local state for form inputs
  const [ctaText, setCtaText] = useState<string>('');
  const [aiPromptConfig, setAiPromptConfig] = useState<string>('');
  const [allFailedMessage, setAllFailedMessage] = useState<string>('');
  const [allPassedMessage, setAllPassedMessage] = useState<string>('');
  const [passedSomeMessage, setPassedSomeMessage] = useState<string>('');
  const [allFailedSubheading, setAllFailedSubheading] = useState<string>('');
  const [allPassedSubheading, setAllPassedSubheading] = useState<string>('');
  const [passedSomeSubheading, setPassedSomeSubheading] = useState<string>('');
  const [heroImageUrl, setHeroImageUrl] = useState<string>('');
  const [fallbackMessage, setFallbackMessage] = useState<string>('');
  
  // Loading and error states
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Default values if no config exists
  const defaultCTAText = "Đây chỉ là phân tích sơ bộ. Để biết rõ điểm mạnh/điểm yếu và cách cải thiện hồ sơ, hãy đi tiếp với Smart Profile Analysis.";
  const defaultAllFailedMessage = "Rất tiếc, hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào. Hãy thử lại sau khi cập nhật thêm thông tin.";
  const defaultAllPassedMessage = "Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng.";
  const defaultPassedSomeMessage = "Dưới đây là danh sách các học bổng bạn đủ điều kiện.";
  const defaultAllFailedSubheading = "Hiện tại bạn chưa đủ điều kiện cho bất kỳ học bổng nào";
  const defaultAllPassedSubheading = "Chúc mừng! Bạn đủ điều kiện cho tất cả các học bổng";
  const defaultPassedSomeSubheading = "Dưới đây là danh sách các học bổng bạn đủ điều kiện";
  
  // Load configuration data when it becomes available
  useEffect(() => {
    if (resultPageConfig) {
      setCtaText(resultPageConfig.ctaText || defaultCTAText);
      setAiPromptConfig(resultPageConfig.aiPromptConfig || '');
      setAllFailedMessage(resultPageConfig.allFailedMessage || defaultAllFailedMessage);
      setAllPassedMessage(resultPageConfig.allPassedMessage || defaultAllPassedMessage);
      setPassedSomeMessage(resultPageConfig.passedSomeMessage || defaultPassedSomeMessage);
      setAllFailedSubheading(resultPageConfig.allFailedSubheading || defaultAllFailedSubheading);
      setAllPassedSubheading(resultPageConfig.allPassedSubheading || defaultAllPassedSubheading);
      setPassedSomeSubheading(resultPageConfig.passedSomeSubheading || defaultPassedSomeSubheading);
      setHeroImageUrl(resultPageConfig.heroImageUrl || '');
      setFallbackMessage(resultPageConfig.fallbackMessage || '');
    } else {
      // If no config exists, use default values
      setCtaText(defaultCTAText);
      setAllFailedMessage(defaultAllFailedMessage);
      setAllPassedMessage(defaultAllPassedMessage);
      setPassedSomeMessage(defaultPassedSomeMessage);
      setAllFailedSubheading(defaultAllFailedSubheading);
      setAllPassedSubheading(defaultAllPassedSubheading);
      setPassedSomeSubheading(defaultPassedSomeSubheading);
      setHeroImageUrl('');
      setFallbackMessage('');
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
        allFailedMessage,
        allPassedMessage,
        passedSomeMessage,
        allFailedSubheading,
        allPassedSubheading,
        passedSomeSubheading,
        heroImageUrl,
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
  
  // Format date with native JavaScript
  const formatDate = (date: string) => {
    try {
      const dateObj = new Date(date);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      const hours = String(dateObj.getHours()).padStart(2, '0');
      const minutes = String(dateObj.getMinutes()).padStart(2, '0');
      const seconds = String(dateObj.getSeconds()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return date;
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
        <Alert className="mx-6 -mt-4 mb-6 bg-red-50 border-red-200 text-red-800">
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
      
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="mx-6 mb-4">
          <TabsTrigger value="content">Nội dung</TabsTrigger>
          <TabsTrigger value="history">Lịch sử thay đổi</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content">
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Hero Image URL */}
              <div className="space-y-2">
                <Label htmlFor="heroImageUrl">Hero Image URL (Hình mở đầu ở Row A)</Label>
                <input
                  id="heroImageUrl"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="Nhập URL hình ảnh (PNG/JPG/WebP)"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-sm text-muted-foreground">Nếu để trống, hệ thống sẽ dùng nền gradient mặc định.</p>
              </div>
              
              {/* Fallback Message */}
              <div className="space-y-2">
                <Label htmlFor="fallbackMessage">Fallback Message (hiển thị khi không có học bổng nào)</Label>
                <textarea
                  id="fallbackMessage"
                  value={fallbackMessage}
                  onChange={(e) => setFallbackMessage(e.target.value)}
                  placeholder="Nhập thông điệp fallback cho trường hợp không đủ điều kiện"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              
              {/* CTA Text Configuration */}
              <div className="space-y-2">
                <Label htmlFor="ctaText">CTA Text (dưới Insight Box)</Label>
                <textarea
                  id="ctaText"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Nhập văn bản kêu gọi người dùng tiếp tục vào Smart Profile Analysis"
                  className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-sm text-muted-foreground">
                  Văn bản này sẽ hiển thị dưới hộp phân tích AI, kêu gọi người dùng tiếp tục với Smart Profile Analysis.
                </p>
              </div>
              
              {/* AI Prompt Configuration */}
              <div className="space-y-2">
                <Label htmlFor="aiPromptConfig">AI Prompt Configuration</Label>
                <textarea
                  id="aiPromptConfig"
                  value={aiPromptConfig}
                  onChange={(e) => setAiPromptConfig(e.target.value)}
                  placeholder="Cấu hình prompt cho AI"
                  className="min-h-[160px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-sm text-muted-foreground">
                  Cấu hình này sẽ được sử dụng cho hệ thống AI để tạo phản hồi tùy chỉnh dựa trên hồ sơ người dùng.
                </p>
              </div>
              
              <Separator className="my-4" />
              
              {/* Message Configuration for Different Scenarios */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold">Thông báo cho từng tình huống</h3>
                
                {/* All Failed Scenario */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-md">
                  <Label htmlFor="allFailedMessage">Tình huống: Không đủ điều kiện cho bất kỳ học bổng nào</Label>
                  <textarea
                    id="allFailedMessage"
                    value={allFailedMessage}
                    onChange={(e) => setAllFailedMessage(e.target.value)}
                    placeholder="Nhập thông báo cho tình huống này"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Label htmlFor="allFailedSubheading" className="mt-4">Tiêu đề phụ (banner)</Label>
                  <input
                    id="allFailedSubheading"
                    value={allFailedSubheading}
                    onChange={(e) => setAllFailedSubheading(e.target.value)}
                    placeholder="Nhập tiêu đề phụ"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                {/* All Passed Scenario */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-md">
                  <Label htmlFor="allPassedMessage">Tình huống: Đủ điều kiện cho tất cả các học bổng</Label>
                  <textarea
                    id="allPassedMessage"
                    value={allPassedMessage}
                    onChange={(e) => setAllPassedMessage(e.target.value)}
                    placeholder="Nhập thông báo cho tình huống này"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Label htmlFor="allPassedSubheading" className="mt-4">Tiêu đề phụ (banner)</Label>
                  <input
                    id="allPassedSubheading"
                    value={allPassedSubheading}
                    onChange={(e) => setAllPassedSubheading(e.target.value)}
                    placeholder="Nhập tiêu đề phụ"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                
                {/* Passed Some Scenario */}
                <div className="space-y-2 p-4 bg-muted/50 rounded-md">
                  <Label htmlFor="passedSomeMessage">Tình huống: Đủ điều kiện cho một số học bổng</Label>
                  <textarea
                    id="passedSomeMessage"
                    value={passedSomeMessage}
                    onChange={(e) => setPassedSomeMessage(e.target.value)}
                    placeholder="Nhập thông báo cho tình huống này"
                    className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  <Label htmlFor="passedSomeSubheading" className="mt-4">Tiêu đề phụ (banner)</Label>
                  <input
                    id="passedSomeSubheading"
                    value={passedSomeSubheading}
                    onChange={(e) => setPassedSomeSubheading(e.target.value)}
                    placeholder="Nhập tiêu đề phụ"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
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
        </TabsContent>
        
        <TabsContent value="history">
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Lịch sử thay đổi nội dung</h3>
            {versionHistory && versionHistory.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-4 space-y-4">
                  {versionHistory.map((version: { updatedAt?: string; createdAt: string; ctaText?: string; allFailedMessage?: string; allPassedMessage?: string; passedSomeMessage?: string; }, index: number) => (
                    <div key={index} className="p-4 border rounded-md bg-muted/30">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Phiên bản {index + 1}</span>
                        <span className="text-xs text-muted-foreground">
                          {version.updatedAt ? formatDate(version.updatedAt) : formatDate(version.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>CTA Text: {version.ctaText?.substring(0, 100)}...</p>
                        {version.allFailedMessage && (
                          <p>Thông báo không đủ điều kiện: {version.allFailedMessage.substring(0, 100)}...</p>
                        )}
                        {version.allPassedMessage && (
                          <p>Thông báo đủ tất cả: {version.allPassedMessage.substring(0, 100)}...</p>
                        )}
                        {version.passedSomeMessage && (
                          <p>Thông báo đủ một số: {version.passedSomeMessage.substring(0, 100)}...</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                Chưa có lịch sử thay đổi
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
};