import rules from "@/rules/aas.json"; // ví dụ: import rule cho học bổng AAS

type FormData = {
  fullName: string;
  age: string;
};

type Rule = {
  field: string;
  type: "min" | "required";
  value: any;
  message: string;
};

type Result = {
  eligible: boolean;
  messages: string[];
};

export function useEligibilityEngine(formData: FormData) {
  const errors: string[] = [];
  if (!Array.isArray(rules)) errors.push("Rule file bị lỗi cấu trúc!");

  let eligible = true;
  const messages: string[] = [];

  for (const rule of rules as Rule[]) {
    const value = formData[rule.field];
    if (rule.type === "required" && !value) {
      eligible = false;
      messages.push(rule.message);
    }
    if (rule.type === "min" && Number(value) < rule.value) {
      eligible = false;
      messages.push(rule.message);
    }
  }

  return { result: { eligible, messages }, errors };
}