import React from "react";
import { Check } from "lucide-react";
import { monthLabel } from "../utils/dateUtils";
import { fmtRupee, fmtDate } from "../utils/formatUtils";

export default function ReceiptModal({ receipt, onClose }) {
  return (
    <div className="mt-modal-overlay" onClick={onClose}>
      <div className="mt-modal mt-receipt" onClick={(e) => e.stopPropagation()}>
        <div className="mt-receipt-check">
          <Check size={22} />
        </div>
        <div className="mt-receipt-title">Payment Recorded</div>
        <div className="mt-receipt-amt">{fmtRupee(receipt.amount)}</div>
        <div className="mt-receipt-grid">
          <span>Flat</span>
          <span>#{receipt.flatId}</span>
          <span>Mode</span>
          <span>{receipt.mode}</span>
          <span>Months Covered</span>
          <span>{receipt.monthsCovered}</span>
          <span>Paid Up To</span>
          <span>{monthLabel(receipt.paidUntil)}</span>
          <span>Date</span>
          <span>{fmtDate(receipt.date)}</span>
        </div>
        <button className="mt-collect-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
