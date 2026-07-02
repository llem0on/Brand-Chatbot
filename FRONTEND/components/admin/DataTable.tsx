type Props = {
  headers: string[];
  loading?: boolean;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
};

export default function DataTable({ headers, loading, empty, emptyMessage = "Belum ada data", children }: Props) {
  return (
    <div className="bg-surface border border-accent/10 rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-accent/10 text-left text-[11px] tracking-[0.12em] uppercase text-ink/40">
            {headers.map((h) => (
              <th key={h} className="px-5 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-accent/5">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-8 text-center text-ink/40">
                Memuat...
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={headers.length} className="px-5 py-8 text-center text-ink/40">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
