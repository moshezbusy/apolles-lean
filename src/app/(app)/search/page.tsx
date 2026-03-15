import { PageHeader } from "~/components/layout/page-header";
import { SearchForm } from "~/features/search/search-form";

export default function SearchPage() {
  return (
    <section>
      <PageHeader
        title="Search"
        description="Find hotel inventory across connected suppliers with fast, validated search."
      />

      <SearchForm />
    </section>
  );
}
