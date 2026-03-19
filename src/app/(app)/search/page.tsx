import { PageHeader } from "~/components/layout/page-header";
import { SearchForm } from "~/features/search/search-form";

export default function SearchPage() {
  return (
    <section className="space-y-8">
      <PageHeader
        title="Search"
        description="Search live hotel inventory from a compact booking-style workspace designed for fast agent use."
      />

      <SearchForm />
    </section>
  );
}
