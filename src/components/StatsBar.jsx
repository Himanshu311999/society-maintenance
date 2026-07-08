import React from "react";
import { TrendingUp, CircleDollarSign, Wallet, Banknote, Smartphone, Landmark } from "lucide-react";
import { fmtRupee } from "../utils/formatUtils";

export default function StatsBar({ totals }) {
  const { totalCollected, totalPending, flatsClear, totalFlats, modeTotals } = totals;

  return (
    <section className="mt-stats">
      <div className="mt-stat mt-stat-collected">
        <TrendingUp size={16} />
        <div>
          <div className="mt-stat-label">Total Collected</div>
          <div className="mt-stat-value">{fmtRupee(totalCollected)}</div>
        </div>
      </div>

      <div className="mt-stat mt-stat-pending">
        <CircleDollarSign size={16} />
        <div>
          <div className="mt-stat-label">Total Pending</div>
          <div className="mt-stat-value">{fmtRupee(totalPending)}</div>
        </div>
      </div>

      <div className="mt-stat">
        <Wallet size={16} />
        <div>
          <div className="mt-stat-label">Flats Clear</div>
          <div className="mt-stat-value">
            {flatsClear} / {totalFlats}
          </div>
        </div>
      </div>

      <div className="mt-stat mt-stat-modes">
        <div className="mt-mode-chip">
          <Banknote size={13} /> {fmtRupee(modeTotals.Cash)}
        </div>
        <div className="mt-mode-chip">
          <Smartphone size={13} /> {fmtRupee(modeTotals.UPI)}
        </div>
        <div className="mt-mode-chip">
          <Landmark size={13} /> {fmtRupee(modeTotals.Cheque)}
        </div>
      </div>
    </section>
  );
}
