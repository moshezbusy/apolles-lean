import { PageHeader } from "~/components/layout/page-header";

export default function SearchPage() {
  return (
    <section>
      <PageHeader
        title="Search"
        description="Use this workspace to search supplier inventory in upcoming stories."
      />

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-sm text-text-secondary">Search form and results will be added in Epic 2.</p>
      </div>
    </section>
  );
}
