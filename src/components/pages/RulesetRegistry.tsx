import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { t, setLang } from "@/lib/i18n";
import { listAvailableRuleIds } from "@/lib/engine/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

export const RulesetRegistry: React.FC = () => {
  const publish = useMutation(api.scholarships.publishRuleset);
  const toggleScholarship = useMutation(api.scholarships.toggleScholarship);
  const scholarships = useQuery(api.scholarships.listScholarships, {});

  const [scholarshipId, setScholarshipId] = useState<'aas' | 'chevening'>('aas');
  const [version, setVersion] = useState('1.0.0');
  const [json, setJson] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const preview = useQuery(api.scholarships.getActiveRules, { scholarshipId });

  const availableIds = useMemo(() => listAvailableRuleIds(), []);

  const scholarshipNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    (scholarships ?? []).forEach((s) => {
      map[s.id] = s.name;
    });
    return map;
  }, [scholarships]);

  const [uiLang, setUiLang] = useState<"en" | "vi">(() => {
    try {
      const stored = localStorage.getItem('lang') as string | null;
      if (stored === 'en' || stored === 'vi') return stored;
    } catch {}
    return 'en';
  });
  const onChangeLang = (val: "en" | "vi") => {
    setUiLang(val);
    setLang(val);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setPublishing(true);
    try {
      const res = await publish({ scholarshipId, version, json, isActive });
      if ((res as any).ok) {
        setResult('Published successfully');
        toast.success('Ruleset published');
        setJson('');
      } else {
        const issues = (res as any).issues ?? [];
        const message = 'Failed to publish: ' + issues.join('; ');
        setResult(message);
        toast.error(message);
      }
    } catch (err) {
      const message = 'Error: ' + String(err);
      setResult(message);
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  };

  const handleToggleScholarship = async (id: string, enabled: boolean) => {
    setTogglingId(id);
    try {
      await toggleScholarship({ id, enabled });
      const name = scholarshipNameMap[id] ?? id.toUpperCase();
      toast.success(`${enabled ? 'Enabled' : 'Disabled'} ${name}`);
    } catch (error) {
      const name = scholarshipNameMap[id] ?? id.toUpperCase();
      toast.error(`Failed to update ${name}`);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 py-10">
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>Ruleset Editor</CardTitle>
            <CardDescription>Publish or activate rulesets for each scholarship.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Scholarship</label>
                <select
                  value={scholarshipId}
                  onChange={(e) => setScholarshipId(e.target.value as any)}
                  className="border px-3 py-2 rounded-md"
                >
                  <option value="aas">AAS</option>
                  <option value="chevening">Chevening</option>
                </select>
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Version</label>
                <input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="border px-3 py-2 rounded-md"
                  placeholder="1.0.0"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Rules JSON</label>
                <textarea
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  className="border px-3 py-2 rounded-md h-56 font-mono"
                  placeholder="Paste rules JSON here"
                />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                <span>Set as active ruleset</span>
              </div>
              <Button type="submit" disabled={publishing} className="w-full">
                {publishing ? 'Publishing...' : 'Publish ruleset'}
              </Button>
              {result && <p className="text-sm text-muted-foreground">{result}</p>}
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>Active Ruleset Preview</CardTitle>
            <CardDescription>Validate the currently active ruleset.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground">Language</label>
              <select
                value={uiLang}
                onChange={(e) => onChangeLang(e.target.value as any)}
                className="border px-2 py-1 rounded"
              >
                <option value="en">English</option>
                <option value="vi">Ti?ng Vi?t</option>
              </select>
            </div>
            {!preview ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  <Badge variant={preview.ok ? 'success' : 'destructive'}>
                    {preview.ok ? 'OK' : 'Invalid'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><span className="font-medium">Version:</span> {preview.version ?? '-'}</div>
                  <div><span className="font-medium">Rules:</span> {preview.rules?.length ?? 0}</div>
                </div>
                {Array.isArray(preview.rules) && preview.rules.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Messages ({uiLang}):</p>
                    <ul className="list-disc ml-5 space-y-1">
                      {(() => {
                        const seen = new Set<string>();
                        const out: JSX.Element[] = [];
                        const flatten = (node: any) => {
                          if (!node) return;
                          if ('type' in node) {
                            const key = node.messageKey || node.message || node.id;
                            if (!seen.has(key)) {
                              seen.add(key);
                              out.push(<li key={key}>{t(node.messageKey, node.message)}</li>);
                            }
                            return;
                          }
                          if (Array.isArray(node.rules)) node.rules.forEach(flatten);
                        };
                        (preview.rules as any[]).forEach(flatten);
                        return out;
                      })()}
                    </ul>
                  </div>
                )}
                {preview.issues?.length > 0 && (
                  <div className="p-2 rounded bg-yellow-100 text-yellow-800">
                    Issues: {preview.issues.join('; ')}
                  </div>
                )}
                {preview.json && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-700">Show JSON</summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto max-h-64 text-xs">
                      {preview.json}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Scholarship Manager</CardTitle>
          <CardDescription>Enable or disable scholarships in the public experience.</CardDescription>
        </CardHeader>
        <CardContent>
          {!scholarships ? (
            <p className="text-sm text-muted-foreground">Loading scholarships...</p>
          ) : scholarships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scholarships configured yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Scholarship</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Enabled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scholarships.map((sch) => (
                  <TableRow key={sch.id}>
                    <TableCell className="font-medium">{sch.name}</TableCell>
                    <TableCell>
                      <Badge variant={sch.isEnabled ? 'success' : 'destructive'}>
                        {sch.isEnabled ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Switch
                        checked={sch.isEnabled}
                        onCheckedChange={(checked) => handleToggleScholarship(sch.id, checked)}
                        disabled={togglingId === sch.id}
                        aria-label={`Toggle ${sch.name}`}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm border">
        <CardHeader>
          <CardTitle>Discovered Rule IDs</CardTitle>
          <CardDescription>Rule files bundled with the frontend for validation.</CardDescription>
        </CardHeader>
        <CardContent>
          {availableIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rule files found under types/rules.</p>
          ) : (
            <ul className="list-disc ml-5 text-sm space-y-1">
              {availableIds.map((id) => (
                <li key={id}>{id}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};




