export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-3 text-gray-500 py-8 justify-center" role="status" aria-live="polite">
      <span className="loader-spinner w-4 h-4 rounded-full border-2 border-gray-200 border-t-primary" />
      <span className="text-sm">{label}</span>
    </div>
  );
}