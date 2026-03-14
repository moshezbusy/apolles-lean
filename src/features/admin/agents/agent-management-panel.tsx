"use client";

import { type FormEvent, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

import {
  createAgentAction,
  setAgentStatusAction,
  type AgentListItem,
} from "~/features/admin/agents/actions";
import {
  getFieldDescribedBy,
  getFieldErrorId,
  getFieldHintId,
  getFirstInvalidField,
  type CreateAgentField,
  type CreateAgentFormValues,
  type FieldErrors,
} from "~/features/admin/agents/agent-management-form";
import { createAgentInputSchema } from "~/features/admin/agents/schemas";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";

type Props = {
  agents: AgentListItem[];
};

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

const INITIAL_FORM_VALUES: CreateAgentFormValues = {
  name: "",
  email: "",
  password: "",
};

export function AgentManagementPanel({ agents }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<CreateAgentFormValues>(INITIAL_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingAgentId, setPendingAgentId] = useState<string | null>(null);
  const fieldRefs = useRef<Record<CreateAgentField, HTMLInputElement | null>>({
    name: null,
    email: null,
    password: null,
  });

  function focusFirstInvalidField(errors: FieldErrors) {
    const firstInvalidField = getFirstInvalidField(errors);

    if (!firstInvalidField) {
      return;
    }

    const field = fieldRefs.current[firstInvalidField];
    field?.focus();
    field?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function setFieldValue(field: keyof CreateAgentFormValues, value: string) {
    setFormValues((previous) => ({ ...previous, [field]: value }));
    setFormError(null);
  }

  function validateField(field: keyof CreateAgentFormValues, nextValues: CreateAgentFormValues) {
    const result = createAgentInputSchema.safeParse(nextValues);

    if (result.success) {
      setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
      return;
    }

    const issue = result.error.issues.find((item) => item.path[0] === field);
    setFieldErrors((previous) => ({ ...previous, [field]: issue?.message }));
  }

  function resetForm() {
    setFormValues(INITIAL_FORM_VALUES);
    setFieldErrors({});
    setFormError(null);
  }

  function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = createAgentInputSchema.safeParse(formValues);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          nextErrors[field as keyof CreateAgentFormValues] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      focusFirstInvalidField(nextErrors);
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("name", parsed.data.name);
      formData.set("email", parsed.data.email);
      formData.set("password", parsed.data.password);

      const result = await createAgentAction(formData);
      if (!result.success) {
        setFormError(result.error.message);
        return;
      }

      toast.success(result.data.message, { duration: 4000 });
      setDialogOpen(false);
      resetForm();
      router.refresh();
    });
  }

  function handleStatusToggle(agent: AgentListItem, nextIsActive: boolean) {
    startTransition(async () => {
      setPendingAgentId(agent.id);

      const formData = new FormData();
      formData.set("userId", agent.id);
      formData.set("isActive", String(nextIsActive));

      const result = await setAgentStatusAction(formData);
      setPendingAgentId(null);

      if (!result.success) {
        toast.error(result.error.message);
        return;
      }

      toast.success(result.data.message, { duration: 4000 });
      router.refresh();
    });
  }

  return (
    <>
      <Toaster position="bottom-right" />

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Agent Management</h2>
            <p className="text-sm text-text-secondary">Create, activate, and deactivate agent accounts.</p>
          </div>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(nextOpen) => {
              setDialogOpen(nextOpen);
              if (!nextOpen) {
                resetForm();
              }
            }}
          >
            <DialogTrigger render={<Button type="button" />}>Create Agent</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Agent</DialogTitle>
                <DialogDescription>
                  Add a new agent account with an initial password. The user can sign in immediately if
                  active.
                </DialogDescription>
              </DialogHeader>

              <form id="create-agent-form" onSubmit={handleCreateSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="agent-name" className="text-sm font-medium text-text-primary">
                    Name
                  </label>
                  <Input
                    id="agent-name"
                    ref={(element) => {
                      fieldRefs.current.name = element;
                    }}
                    value={formValues.name}
                    onChange={(event) => setFieldValue("name", event.currentTarget.value)}
                    onBlur={() => validateField("name", formValues)}
                    aria-describedby={getFieldDescribedBy("name", Boolean(fieldErrors.name))}
                    aria-invalid={fieldErrors.name ? true : undefined}
                    required
                  />
                  {fieldErrors.name ? (
                    <p id={getFieldErrorId("name")} className="text-xs text-error">
                      {fieldErrors.name}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label htmlFor="agent-email" className="text-sm font-medium text-text-primary">
                    Email
                  </label>
                  <Input
                    id="agent-email"
                    type="email"
                    ref={(element) => {
                      fieldRefs.current.email = element;
                    }}
                    value={formValues.email}
                    onChange={(event) => setFieldValue("email", event.currentTarget.value)}
                    onBlur={() => validateField("email", formValues)}
                    aria-describedby={getFieldDescribedBy("email", Boolean(fieldErrors.email))}
                    aria-invalid={fieldErrors.email ? true : undefined}
                    required
                  />
                  {fieldErrors.email ? (
                    <p id={getFieldErrorId("email")} className="text-xs text-error">
                      {fieldErrors.email}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label htmlFor="agent-password" className="text-sm font-medium text-text-primary">
                    Initial password
                  </label>
                  <Input
                    id="agent-password"
                    type="password"
                    ref={(element) => {
                      fieldRefs.current.password = element;
                    }}
                    value={formValues.password}
                    onChange={(event) => setFieldValue("password", event.currentTarget.value)}
                    onBlur={() => validateField("password", formValues)}
                    aria-describedby={getFieldDescribedBy("password", Boolean(fieldErrors.password))}
                    aria-invalid={fieldErrors.password ? true : undefined}
                    required
                  />
                  <p id={getFieldHintId("password")} className="text-xs text-text-secondary">
                    Minimum 12 chars, including uppercase, lowercase, number, and special character.
                  </p>
                  {fieldErrors.password ? (
                    <p id={getFieldErrorId("password")} className="text-xs text-error">
                      {fieldErrors.password}
                    </p>
                  ) : null}
                </div>

                {formError ? (
                  <p className="rounded-md border border-error/30 bg-error-bg px-3 py-2 text-sm text-error">
                    {formError}
                  </p>
                ) : null}
              </form>

              <DialogFooter>
                <Button type="submit" form="create-agent-form" disabled={isPending}>
                  {isPending ? "Creating..." : "Create Agent"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border-subtle text-sm">
            <thead>
              <tr className="bg-surface">
                <th className="px-6 py-3 text-left font-semibold text-text-secondary">Name</th>
                <th className="px-6 py-3 text-left font-semibold text-text-secondary">Email</th>
                <th className="px-6 py-3 text-left font-semibold text-text-secondary">Status</th>
                <th className="px-6 py-3 text-left font-semibold text-text-secondary">Date created</th>
                <th className="px-6 py-3 text-right font-semibold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {agents.map((agent) => {
                const isRowPending = pendingAgentId === agent.id && isPending;

                return (
                  <tr key={agent.id}>
                    <td className="px-6 py-4 text-text-primary">{agent.name}</td>
                    <td className="px-6 py-4 text-text-secondary">{agent.email}</td>
                    <td className="px-6 py-4">
                      <Badge variant={agent.isActive ? "default" : "secondary"}>
                        {agent.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {DATE_FORMATTER.format(new Date(agent.createdAt))}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        type="button"
                        variant={agent.isActive ? "destructive" : "secondary"}
                        disabled={isRowPending}
                        onClick={() => handleStatusToggle(agent, !agent.isActive)}
                      >
                        {isRowPending
                          ? "Saving..."
                          : agent.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {agents.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-text-secondary">
              No agents found. Create your first agent account to begin onboarding.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
