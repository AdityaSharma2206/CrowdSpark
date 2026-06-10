function ReportCard({
  title,
  value,
  showCurrency = false,
}: {
  title: string;
  value: number;
  showCurrency?: boolean;
}) {
  return (
    <div className="border border-primary border-solid rounded-sm p-5 bg-gray-100 flex flex-col gap-7">
      <h1 className="text-lg font-bold text-primary">{title}</h1>
      <h1 className="text-5xl text-center font-bold text-primary">
        {showCurrency && "$"}
        {value}
      </h1>
    </div>
  );
}

export default ReportCard;
