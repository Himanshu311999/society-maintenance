import React from "react";
import { History, Trash2 } from "lucide-react";
import { fmtRupee, fmtDate } from "../utils/formatUtils";

export default function PaymentHistoryList({ flatId, payments, onDelete }) {
  if (!payments || payments.length === 0) return null;

  const sorted = [...payments].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <div className="mt-divider" />
      <div className="mt-form-label">
        <History size={13} /> History — Flat {flatId}
      </div>
      <div className="mt-history">
        {sorted.map((p) => (
          <div className="mt-history-row" key={p.id}>
            <div>
              <div className="mt-hist-amt">
                {fmtRupee(p.amount)} <span className="mt-hist-mode">· {p.mode}</span>
              </div>
              <div className="mt-hist-date">
                {fmtDate(p.date)} · {p.monthsCovered} mo. covered
              </div>
            </div>
            <button className="mt-del-btn" onClick={() => onDelete(p.id)} title="Delete entry">
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
