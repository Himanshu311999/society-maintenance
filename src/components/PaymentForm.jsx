import React from "react";
import { Banknote, Smartphone, Landmark, Receipt, ChevronDown } from "lucide-react";
import { fmtRupee } from "../utils/formatUtils";
import { PAYMENT_MODES } from "../constants";

const MODE_ICONS = { Cash: Banknote, UPI: Smartphone, Cheque: Landmark };

export default function PaymentForm({
  monthlyAmount,
  owed,
  amountInput,
  setAmountInput,
  showCustom,
  setShowCustom,
  mode,
  setMode,
  onSubmit,
}) {
  return (
    <>
      <div className="mt-form-label">Collect Payment</div>

      <div className="mt-quick-select-wrap">
        <select
          className="mt-quick-select"
          value={showCustom ? "custom" : amountInput}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setShowCustom(true);
            } else {
              setShowCustom(false);
              setAmountInput(e.target.value);
            }
          }}
        >
          {owed > 0 && <option value={owed}>{fmtRupee(owed)} — Amount Due</option>}
          {Array.from({ length: 6 }, (_, i) => i + 1)
            .map((n) => monthlyAmount * n)
            .filter((v) => v !== owed)
            .map((v) => {
              const n = v / monthlyAmount;
              return (
                <option key={v} value={v}>
                  {fmtRupee(v)} — {n} month{n > 1 ? "s" : ""}
                </option>
              );
            })}
          <option value="custom">Custom amount…</option>
        </select>
        <span className="mt-select-caret">
          <ChevronDown size={16} />
        </span>
      </div>

      {showCustom && (
        <div className="mt-amount-row">
          <span className="mt-rupee">₹</span>
          <input
            type="number"
            autoFocus
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="mt-amount-input"
          />
        </div>
      )}

      <div className="mt-form-label">Payment Mode</div>
      <div className="mt-mode-row">
        {PAYMENT_MODES.map((key) => {
          const Icon = MODE_ICONS[key];
          return (
            <button
              key={key}
              className={`mt-mode-btn ${mode === key ? "mt-mode-active" : ""}`}
              onClick={() => setMode(key)}
            >
              <Icon size={15} /> {key}
            </button>
          );
        })}
      </div>

      <button
        className="mt-collect-btn"
        onClick={onSubmit}
        disabled={!amountInput || parseFloat(amountInput) <= 0}
      >
        <Receipt size={16} /> Record Payment
      </button>
    </>
  );
}
