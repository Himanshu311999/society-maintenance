export function fmtRupee(n) {
  const v = Math.round(n);
  return "₹" + v.toLocaleString("en-IN");
}

export function fmtDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
