interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <section className="border-b border-[#E5E0D8] bg-[#F2EFE9]/60">
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 md:py-20">
        <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#8B6F47] mb-3">
          {eyebrow}
        </p>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold text-[#18181B] tracking-tight max-w-2xl leading-[1.15]">
          {title}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#52525B] max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
    </section>
  );
}
