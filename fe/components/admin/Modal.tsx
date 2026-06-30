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
      style={{ background: "rgba(75,29,36,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="rounded-lg w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ background: "#FDFAF7", border: "1px solid #CBB4A7" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0"
          style={{ borderBottom: "1px solid #E6D9CE", background: "#FDFAF7" }}
        >
          <h2 className="font-serif text-lg" style={{ color: "#4B1D24" }}>{title}</h2>
          <button
            onClick={onClose}
            className="text-xl leading-none transition-opacity hover:opacity-60"
            style={{ color: "#A56A6C" }}
          >
            &times;
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
