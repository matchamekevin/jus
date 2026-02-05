const STEPS = ["pending", "preparing", "delivering", "delivered"];

const LABELS = {
  pending: "En attente",
  preparing: "En preparation",
  delivering: "En livraison",
  delivered: "Livree"
};

export default function StatusTimeline({ status }) {
  const activeIndex = Math.max(0, STEPS.indexOf(status));
  return (
    <div className="timeline">
      {STEPS.map((step, index) => (
        <div key={step} className={`step ${index <= activeIndex ? "active" : ""}`}>
          <div className="dot" />
          <span>{LABELS[step]}</span>
        </div>
      ))}
    </div>
  );
}
