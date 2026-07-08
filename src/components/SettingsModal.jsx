import React, { useState } from "react";
import { X, Check, Trash2 } from "lucide-react";

export default function SettingsModal({ monthlyAmount, onSave, onReset, onClose }) {
  const [rateDraft, setRateDraft] = useState(String(monthlyAmount));

  function handleSave() {
    const v = parseFloat(rateDraft);
    if (!v || v <= 0) return;
    onSave(v);
    onClose();
  }

  return (
    <div className="mt-modal-overlay" onClick={onClose}>
      <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mt-modal-head">
          <span>Settings</span>
          <button className="mt-icon-btn" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="mt-form-label">Default Monthly Maintenance</div>
        <div className="mt-amount-row">
          <span className="mt-rupee">₹</span>
          <input
            type="number"
            className="mt-amount-input"
            value={rateDraft}
            onChange={(e) => setRateDraft(e.target.value)}
          />
        </div>
        <button className="mt-collect-btn" onClick={handleSave}>
          <Check size={16} /> Save Rate
        </button>

        <div className="mt-divider" />

        <button className="mt-danger-btn" onClick={onReset}>
          <Trash2 size={14} /> Reset All Ledger Data
        </button>
      </div>
    </div>
  );
}
