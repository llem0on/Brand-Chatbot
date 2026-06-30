type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(42,36,34,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ background: "#F7F3EC", border: "1px solid #D8CFC4" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{ borderBottom: "1px solid #EDE6DA", background: "#F7F3EC" }}
        >
          <h2 className="font-serif text-lg" style={{ color: "#2A2422" }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none transition-opacity hover:opacity-60"
            style={{ color: "#A89A8C" }}
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
