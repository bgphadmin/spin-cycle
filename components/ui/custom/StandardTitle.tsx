interface StandardFormTitleProps {
  title: string;
  description?: string;
}

export function StandardFormTitle({ title, description }: StandardFormTitleProps) {
  return (
    <div className="mt-0">
      <h1 className="text-3xl font-bold text-teal-700">{title}</h1>
      {description && (
        <p className="mt-2 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}