export default function LoadingState({ label = "Loading content..." }) {
  return (
    <div className="state-card">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}

