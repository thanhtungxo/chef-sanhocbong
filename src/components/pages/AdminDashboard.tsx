import React from 'react';
import { RulesetRegistry } from '@/components/pages/RulesetRegistry';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { FormPreview } from '@/components/pages/FormPreview';
import { FormBuilder } from '@/components/pages/FormBuilder';

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 -mb-px border-b-2 ${active ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
    >
      {children}
    </button>
  );
}

class SimpleBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; message?: string }>{
  constructor(props: any) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, message: String(error?.message ?? error) }; }
  componentDidCatch(error: any) { console.error('AdminDashboard error:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded border bg-red-50 text-red-700 p-4 text-sm">
          <div className="font-medium mb-1">Không tải được nội dung Admin</div>
          <p>{this.state.message}</p>
          <pre className="bg-white border rounded p-2 mt-2 text-xs">npx convex dev{`\n`}npx convex codegen</pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}

// Import the ResultPageConfig component that we'll create next
import { ResultPageConfig } from '@/components/pages/ResultPageConfig';
import AiEnginePage from '@/components/pages/AiEnginePage';

export const AdminDashboard: React.FC = () => {
  const [tab, setTab] = React.useState<'scholarships' | 'forms' | 'result' | 'ai'>('scholarships');
  const active = useQuery(api.forms.getActiveForm, {});

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 py-10">
      <div className="flex gap-4 border-b">
        <TabButton active={tab === 'scholarships'} onClick={() => setTab('scholarships')}>Học bổng</TabButton>
        <TabButton active={tab === 'forms'} onClick={() => setTab('forms')}>Form</TabButton>
        <TabButton active={tab === 'result'} onClick={() => setTab('result')}>Result</TabButton>
        <TabButton active={tab === 'ai'} onClick={() => setTab('ai')}>AI Engine</TabButton>
      </div>

      {tab === 'scholarships' ? (
        <RulesetRegistry />
      ) : tab === 'forms' ? (
        <SimpleBoundary>
          <FormBuilder />
        </SimpleBoundary>
      ) : tab === 'result' ? (
        <SimpleBoundary>
          <ResultPageConfig />
        </SimpleBoundary>
      ) : (
        <SimpleBoundary>
          <AiEnginePage />
        </SimpleBoundary>
      )}
    </div>
  );
};
