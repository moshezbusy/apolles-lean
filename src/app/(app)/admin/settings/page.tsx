import { PageHeader } from "~/components/layout/page-header";
import { AgentManagementPanel } from "~/features/admin/agents/agent-management-panel";
import { listAgentsAction } from "~/features/admin/agents/actions";

export default async function AdminSettingsPage() {
  const agentsResult = await listAgentsAction();

  return (
    <section>
      <PageHeader
        title="Platform Settings"
        description="Manage agent accounts and platform-level controls."
      />

      {!agentsResult.success ? (
        <div className="rounded-xl border border-error/30 bg-error-bg p-6 shadow-sm">
          <p className="text-sm text-error">{agentsResult.error.message}</p>
        </div>
      ) : (
        <AgentManagementPanel agents={agentsResult.data} />
      )}
    </section>
  );
}
