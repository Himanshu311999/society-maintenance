import React from "react";
import { Building2, Search, Settings2 } from "lucide-react";
import { monthLabel } from "../utils/dateUtils";
import { SOCIETY_NAME } from "../constants";

export default function Header({ curMonth, search, onSearchChange, onOpenSettings }) {
  return (
    <header className="mt-header">
      <div className="mt-brand">
        <div className="mt-brand-icon">
          <Building2 size={20} strokeWidth={1.6} />
        </div>
        <div>
          <div className="mt-brand-title">{SOCIETY_NAME}</div>
          <div className="mt-brand-sub">Maintenance Ledger · {monthLabel(curMonth)}</div>
        </div>
      </div>

      <div className="mt-search">
        <Search size={15} />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Jump to flat no. e.g. 304"
        />
      </div>

      <button className="mt-icon-btn" onClick={onOpenSettings} title="Settings">
        <Settings2 size={17} />
      </button>
    </header>
  );
}
