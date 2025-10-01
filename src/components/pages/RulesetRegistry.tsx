import React, { useMemo, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { t, setLang } from "@/lib/i18n";
import { listAvailableRuleIds, getRawRulesJsonText } from "@/lib/engine/loader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

interface RulesetInfo {
  _id: any;
  version: string;
  isActive: boolean;
  createdAt: number;
  json: string;
  scholarshipId: string;
}

const formatDateTime = (value: number | undefined) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

export const RulesetRegistry: React.FC = () => {
  const publish = useMutation(api.scholarships.publishRuleset);
  const toggleScholarship = useMutation(api.scholarships.toggleScholarship);
  const addScholarship = useMutation(api.scholarships.addScholarship);
  const setActiveRuleset = useMutation(api.scholarships.setActiveRuleset);
  const deleteRuleset = useMutation(api.scholarships.deleteRuleset);

  const scholarships = useQuery(api.scholarships.listScholarships, {});

  const [scholarshipId, setScholarshipId] = useState<string>('aas');
  const [version, setVersion] = useState('1.0.0');
  const [json, setJson] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [newScholarshipName, setNewScholarshipName] = useState('');
  const [adding, setAdding] = useState(false);
  const [actingRulesetKey, setActingRulesetKey] = useState<string | null>(null);
  const [deletingRulesetKey, setDeletingRulesetKey] = useState<string | null>(null);

  const rulesets = useQuery(
    api.scholarships.listRulesets,
    scholarshipId ? { scholarshipId } : undefined
  ) as RulesetInfo[] | undefined;

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

  const rulesetArgsForPublish = useMemo(
    () => ({ scholarshipId, version, json, isActive }),
    [scholarshipId, version, json, isActive]
  );


  const getRulesetKey = (ruleset: RulesetInfo) => {
    const raw = (ruleset as any)?._id;
    if (raw && typeof raw === 'object' && 'id' in raw) {
      return String((raw as any).id);
    }
    return String(ruleset.version ?? Date.now());
  };

  const loadBundledJson = () => {
    const raw = getRawRulesJsonText(scholarshipId);
    if (!raw) {
      toast.error('No bundled JSON found for this scholarship');
      return;
    }
    setJson(raw);
    toast.success('Loaded bundled JSON');
  };

  const handleLoadRuleset = (ruleset: RulesetInfo) => {
    setVersion(ruleset.version ?? '1.0.0');
    setJson(ruleset.json ?? '');
    setIsActive(ruleset.isActive ?? false);
    setResult(`Loaded ruleset ${ruleset.version}`);
  };

  const handleSetActive = async (ruleset: RulesetInfo, active: boolean) => {
    const key = getRulesetKey(ruleset);
    setActingRulesetKey(key);
    try {
      await setActiveRuleset({ rulesetId: ruleset._id, active } as any);
      toast.success(active ? 'Activated ruleset' : 'Deactivated ruleset');
    } catch (err) {
      toast.error('Failed to update ruleset status');
    } finally {
      setActingRulesetKey(null);
    }
  };

  const handleDeleteRuleset = async (ruleset: RulesetInfo) => {
    if (!window.confirm('Delete this ruleset?')) return;
    const key = getRulesetKey(ruleset);
    setDeletingRulesetKey(key);
    try {
      await deleteRuleset({ rulesetId: ruleset._id } as any);
      toast.success('Ruleset deleted');
    } catch (err) {
      toast.error('Failed to delete ruleset');
    } finally {
      setDeletingRulesetKey(null);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setPublishing(true);
    try {
      const res = await publish(rulesetArgsForPublish as any);
      if ((res as any).ok) {
        setResult('Published successfully');
        toast.success('Ruleset published');
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

  const handleAddScholarship = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newScholarshipName.trim();
    if (!name) {
      toast.error("Please enter a scholarship name");
      return;
    }
    setAdding(true);
    try {
      await addScholarship({ name });
      toast.success("Scholarship added");
      setNewScholarshipName("");
    } catch (err) {
      toast.error("Failed to add scholarship");
    } finally {
      setAdding(false);
    }
  };

  const scholarshipOptions = scholarships ?? [];
  const currentRulesets = rulesets ?? [];

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
                  onChange={(e) => setScholarshipId(e.target.value)}
                  className="border px-3 py-2 rounded-md"
                >
                  {scholarshipOptions.map((sch) => (
                    <option key={sch.id} value={sch.id}>{sch.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Version</label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="1.0.0"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Rules JSON</label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={loadBundledJson}>
                      Load bundled JSON
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setJson('')}>
                      Clear
                    </Button>
                  </div>
                </div>
                <textarea
                  className="font-mono text-xs min-h-[200px]"
                  value={json}
                  onChange={(e) => setJson(e.target.value)}
                  placeholder="Paste rules JSON here"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Set as active ruleset
              </label>

              <Button type="submit" disabled={publishing || !json.trim()}>
                {publishing ? 'Publishing...' : 'Publish ruleset'}
              </Button>
              {result && (
                <div className="p-2 rounded bg-muted text-sm">{result}</div>
              )}
            </form>

            <div className="mt-6">
              <h3 className="font-semibold mb-2">Existing rulesets</h3>
              {!rulesets ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : currentRulesets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No rulesets published yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRulesets.map((ruleset) => (
                      <TableRow key={ruleset.id}>
                        <TableCell>{ruleset.version}</TableCell>
                        <TableCell>
                          <Badge variant={ruleset.isActive ? 'success' : 'secondary'}>
                            {ruleset.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateTime(ruleset.createdAt)}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleLoadRuleset(ruleset)}
                          >
                            Load
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={actingRulesetKey === rulesetKey}
                            onClick={() => handleSetActive(ruleset, !ruleset.isActive)}
                          >
                            {ruleset.isActive ? 'Deactivate' : 'Set active'}
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            disabled={deletingRulesetKey === rulesetKey}
                            onClick={() => handleDeleteRuleset(ruleset)}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border">
          <CardHeader className="flex flex-col gap-2">
            <CardTitle>Active Ruleset Preview</CardTitle>
            <CardDescription>Validate the currently active ruleset.</CardDescription>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Language</span>
              <select
                value={uiLang}
                onChange={(e) => onChangeLang(e.target.value as "en" | "vi")}
                className="border px-2 py-1 rounded"
              >
                <option value="en">English</option>
                <option value="vi">Ti?ng Vi?t</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {!preview ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="font-medium">Source:</span> {preview.source ?? '-'}</div>
                  <div><span className="font-medium">Status:</span> {preview.ok ? 'OK' : 'Invalid'}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
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
          <form onSubmit={handleAddScholarship} className="flex gap-2 mb-4">
            <Input
              value={newScholarshipName}
              onChange={(e) => setNewScholarshipName(e.target.value)}
              placeholder="New scholarship name"
              aria-label="New scholarship name"
            />
            <Button type="submit" disabled={adding}>
              Add
            </Button>
          </form>
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

