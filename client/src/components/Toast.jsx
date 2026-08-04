export default function Toast({ toast }) {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  return (
    <div className={`toast ${toast.type}`}>
      <span>{icons[toast.type] || "ℹ️"}</span>
      <span>{toast.message}</span>
    </div>
  );
}
