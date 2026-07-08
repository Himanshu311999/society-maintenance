import React from "react";
import { monthLabel } from "../utils/dateUtils";

/**
 * Renders one pill per pending month. As `previewCovered` grows (driven by
 * whatever amount is currently selected in the payment form), pills flip
 * from "pending" to "covered", with one "partial" pill in between.
 */
export default function PendingChips({ pending, previewAmt, previewCovered, previewRemainder, previewExtraAdvance }) {
  if (pending.length === 0) return null;

  return (
    <div className="mt-pending-chips">
      {pending.map((m, idx) => {
        let cls = "mt-chip";
        if (previewAmt > 0) {
          if (idx < previewCovered) cls += " mt-chip-covered";
          else if (idx === previewCovered && previewRemainder > 0) cls += " mt-chip-partial";
        }
        return (
          <span key={m} className={cls}>
            {monthLabel(m)}
          </span>
        );
      })}
      {previewExtraAdvance > 0 && (
        <span className="mt-chip mt-chip-advance">+{previewExtraAdvance} mo. advance</span>
      )}
    </div>
  );
}
