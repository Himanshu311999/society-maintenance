import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { useMaintenanceData } from "./hooks/useMaintenanceData";
import Header from "./components/Header";
import StatsBar from "./components/StatsBar";
import BuildingFacade from "./components/BuildingFacade";
import FlatPanel, { EmptyFlatPanel } from "./components/FlatPanel";
import RecentActivity from "./components/RecentActivity";
import SettingsModal from "./components/SettingsModal";
import ReceiptModal from "./components/ReceiptModal";
import SaveWarning from "./components/SaveWarning";

export default function App() {
  const { data, loading, saveError, curMonth, totals, recordPayment, deletePayment, saveRate, resetAll } =
    useMaintenanceData();

  const [selectedFlatId, setSelectedFlatId] = useState(null);
  const [search, setSearch] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [receipt, setReceipt] = useState(null);

  if (loading || !data) {
    return (
      <div className="mt-root mt-loading">
        <div className="mt-loading-inner">
          <Building2 size={28} strokeWidth={1.4} />
          <span>Opening ledger…</span>
        </div>
      </div>
    );
  }

  const { settings, flats } = data;
  const selectedFlat = selectedFlatId ? flats[selectedFlatId] || { missing: true } : null;

  async function handleRecordPayment(amount, mode) {
    const result = await recordPayment(selectedFlatId, amount, mode);
    if (result) setReceipt(result);
  }

  function handleResetAll() {
    resetAll();
    setSelectedFlatId(null);
    setShowSettings(false);
  }

  return (
    <div className="mt-root">
      <Header
        curMonth={curMonth}
        search={search}
        onSearchChange={setSearch}
        onOpenSettings={() => setShowSettings(true)}
      />

      {saveError && <SaveWarning />}

      <StatsBar totals={totals} />

      <main className="mt-main">
        <BuildingFacade
          flats={flats}
          settings={settings}
          curMonth={curMonth}
          selectedFlatId={selectedFlatId}
          onSelectFlat={setSelectedFlatId}
          search={search}
        />

        {selectedFlat ? (
          <FlatPanel
            flatId={selectedFlatId}
            flat={selectedFlat}
            settings={settings}
            curMonth={curMonth}
            onRecordPayment={handleRecordPayment}
            onDeletePayment={(paymentId) => deletePayment(selectedFlatId, paymentId)}
            onClose={() => setSelectedFlatId(null)}
          />
        ) : (
          <EmptyFlatPanel />
        )}

        <RecentActivity transactions={totals.allTx} onSelectFlat={setSelectedFlatId} />
      </main>

      {showSettings && (
        <SettingsModal
          monthlyAmount={settings.monthlyAmount}
          onSave={saveRate}
          onReset={handleResetAll}
          onClose={() => setShowSettings(false)}
        />
      )}

      {receipt && <ReceiptModal receipt={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
