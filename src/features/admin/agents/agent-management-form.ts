export type CreateAgentFormValues = {
  name: string;
  email: string;
  password: string;
};

export type CreateAgentField = keyof CreateAgentFormValues;

export type FieldErrors = Partial<Record<CreateAgentField, string>>;

const CREATE_AGENT_FIELD_ORDER: CreateAgentField[] = ["name", "email", "password"];

export function getFieldErrorId(field: CreateAgentField) {
  return `agent-${field}-error`;
}

export function getFieldHintId(field: CreateAgentField) {
  return `agent-${field}-hint`;
}

export function getFieldDescribedBy(field: CreateAgentField, hasError: boolean) {
  const describedByIds = [];

  if (field === "password") {
    describedByIds.push(getFieldHintId(field));
  }

  if (hasError) {
    describedByIds.push(getFieldErrorId(field));
  }

  return describedByIds.length > 0 ? describedByIds.join(" ") : undefined;
}

export function getFirstInvalidField(errors: FieldErrors): CreateAgentField | null {
  for (const field of CREATE_AGENT_FIELD_ORDER) {
    if (errors[field]) {
      return field;
    }
  }

  return null;
}
