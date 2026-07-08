import React from "react";
import { History, ChevronRight } from "lucide-react";
import { fmtRupee, fmtDate } from "../utils/formatUtils";

export default function RecentActivity({ transactions, onSelectFlat }) {
  return (
    <section className="mt-recent">
      <div className="mt-form-label">
        <History size={13} /> Recent Collections
      </div>

      {transactions.length === 0 && <div className="mt-empty-small">No payments recorded yet.</div>}

      <div className="mt-recent-list">
        {transactions.slice(0, 10).map((t) => (
          <button className="mt-recent-item" key={t.flatId + t.id} onClick={() => onSelectFlat(t.flatId)}>
            <span className="mt-recent-flat">#{t.flatId}</span>
            <span className="mt-recent-amt">{fmtRupee(t.amount)}</span>
            <span className="mt-recent-mode">{t.mode}</span>
            <span className="mt-recent-date">{fmtDate(t.date)}</span>
            <ChevronRight size={13} />
          </button>
        ))}
      </div>
    </section>
  );
}
