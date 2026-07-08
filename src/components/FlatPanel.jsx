import React, { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { pendingMonthsFor, flatStatus } from "../utils/flatUtils";
import { monthLabel } from "../utils/dateUtils";
import { fmtRupee } from "../utils/formatUtils";
import PendingChips from "./PendingChips";
import PaymentForm from "./PaymentForm";

const STATUS_TEXT = {
  clear: () => "Fully paid, up to date",
  advance: (flat) => `Paid in advance till ${monthLabel(flat.paidUntil)}`,
  due: (_, pending) => `${pending.length} month(s) pending`,
  overdue: (_, pending) => `${pending.length} months overdue`,
};

export default function FlatPanel({ flatId, flat, settings, curMonth, onRecordPayment, onDeletePayment, onClose }) {
  const [amountInput, setAmountInput] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [mode, setMode] = useState("Cash");

  if (!flat || flat.missing) {
    return (
      <div className="mt-panel">
        <div className="mt-empty">
          <Sparkles size={22} strokeWidth={1.3} />
          <p>No pending data found for flat {flatId}.</p>
          <p>Select another flat or reset the ledger from Settings.</p>
        </div>
      </div>
    );
  }

  const pending = pendingMonthsFor(flat, settings.startMonth, curMonth);
  const owed = Math.max(0, pending.length * settings.monthlyAmount - (flat.credit || 0));
  const status = flatStatus(flat, settings.startMonth, curMonth);

  // Default the amount whenever the selected flat changes.
  useEffect(() => {
    setShowCustom(false);
    setAmountInput(owed > 0 ? String(owed) : String(settings.monthlyAmount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flatId]);

  const previewAmt = parseFloat(amountInput) || 0;
  const previewTotal = previewAmt + (flat.credit || 0);
  const previewCovered =
    settings.monthlyAmount > 0 ? Math.floor(previewTotal / settings.monthlyAmount) : 0;
  const previewRemainder =
    Math.round((previewTotal - previewCovered * settings.monthlyAmount) * 100) / 100;
  const previewExtraAdvance = Math.max(0, previewCovered - pending.length);

  function handleSubmit() {
    const amt = parseFloat(amountInput);
    if (!amt || amt <= 0) return;
    onRecordPayment(amt, mode);
  }

  return (
    <div className="mt-panel">
      <div className="mt-panel-head">
        <div>
          <div className="mt-panel-flat">Flat {flatId}</div>
          <div className={`mt-panel-status mt-txt-${status}`}>
            {STATUS_TEXT[status](flat, pending)}
          </div>
        </div>
        <button className="mt-icon-btn mt-close" onClick={onClose}>
          <X size={16} />
        </button>
      </div>

      <PendingChips
        pending={pending}
        previewAmt={previewAmt}
        previewCovered={previewCovered}
        previewRemainder={previewRemainder}
        previewExtraAdvance={previewExtraAdvance}
      />

      <div className="mt-owed-row">
        <span>Amount Due</span>
        <strong>{fmtRupee(owed)}</strong>
      </div>
      {flat.credit > 0 && (
        <div className="mt-owed-row mt-credit-row">
          <span>Credit carried</span>
          <strong>{fmtRupee(flat.credit)}</strong>
        </div>
      )}

      <div className="mt-divider" />

      <PaymentForm
        monthlyAmount={settings.monthlyAmount}
        owed={owed}
        amountInput={amountInput}
        setAmountInput={setAmountInput}
        showCustom={showCustom}
        setShowCustom={setShowCustom}
        mode={mode}
        setMode={setMode}
        onSubmit={handleSubmit}
      />

      {/* Payment history removed from inline panel to keep panel height consistent. */}
    </div>
  );
}

export function EmptyFlatPanel() {
  return (
    <div className="mt-panel">
      <div className="mt-empty">
        <Sparkles size={22} strokeWidth={1.3} />
        <p>Select a flat from the building to view its ledger and collect maintenance.</p>
      </div>
    </div>
  );
}
