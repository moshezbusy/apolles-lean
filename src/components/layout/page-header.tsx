type PageHeaderProps = {
  title: string;
  description: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold tracking-tight text-text-primary md:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-text-secondary">{description}</p>
    </header>
  );
}
