import { useState, useEffect, useCallback, useMemo } from "react";
import { makeDefaultData, pendingMonthsFor } from "../utils/flatUtils";
import { currentMonthKey } from "../utils/dateUtils";

const API_ROOT = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

async function fetchJson(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path.startsWith("/") ? path : `/${path}`}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API request failed ${response.status}: ${text}`);
  }

  return response.json();
}

export function useMaintenanceData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState(false);

  const curMonth = useMemo(() => {
    if (data?.settings?.currentMonth) return data.settings.currentMonth;
    return currentMonthKey();
  }, [data]);

  useEffect(() => {
    (async () => {
      try {
        const ledger = await fetchJson("/ledger");
        setData(ledger);
        setSaveError(false);
      } catch (e) {
        console.warn("Failed to load ledger from backend", e);
        setData(makeDefaultData());
        setSaveError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const recordPayment = useCallback(
    async (flatId, amount, mode) => {
      if (!flatId || !amount || amount <= 0) return null;
      try {
        const response = await fetchJson(`/flats/${flatId}/payments`, {
          method: "POST",
          body: JSON.stringify({ amount, mode }),
        });
        setData(response.ledger);
        setSaveError(false);
        const updatedFlat = response.ledger?.flats?.[flatId];
        return {
          ...response.payment,
          flatId,
          paidUntil: updatedFlat?.paidUntil || null,
        };
      } catch (e) {
        console.warn("Failed to record payment", e);
        setSaveError(true);
        return null;
      }
    },
    []
  );

  const deletePayment = useCallback(
    async (flatId, paymentId) => {
      if (!flatId || !paymentId) return;
      try {
        const response = await fetchJson(`/flats/${flatId}/payments/${paymentId}`, {
          method: "DELETE",
        });
        setData(response.ledger);
        setSaveError(false);
      } catch (e) {
        console.warn("Failed to delete payment", e);
        setSaveError(true);
      }
    },
    []
  );

  const saveRate = useCallback(
    async (newRate) => {
      if (!data || !newRate || newRate <= 0) return;
      try {
        const response = await fetchJson(`/settings`, {
          method: "PUT",
          body: JSON.stringify({ monthlyAmount: newRate }),
        });
        setData(response.ledger);
        setSaveError(false);
      } catch (e) {
        console.warn("Failed to save rate", e);
        setSaveError(true);
      }
    },
    [data]
  );

  const resetAll = useCallback(async () => {
    try {
      const response = await fetchJson(`/reset`, { method: "POST" });
      setData(response.ledger);
      setSaveError(false);
    } catch (e) {
      console.warn("Failed to reset ledger", e);
      setSaveError(true);
    }
  }, []);

  const totals = useMemo(() => {
    if (!data) return null;
    const { settings, flats } = data;
    let totalCollected = 0;
    let totalPending = 0;
    let flatsClear = 0;
    const modeTotals = { Cash: 0, UPI: 0, Cheque: 0 };
    const allTx = [];

    Object.entries(flats).forEach(([id, flat]) => {
      const pending = pendingMonthsFor(flat, settings.startMonth, curMonth);
      const owed = Math.max(0, pending.length * settings.monthlyAmount - (flat.credit || 0));
      totalPending += owed;
      if (pending.length === 0) flatsClear++;
      (flat.payments || []).forEach((p) => {
        totalCollected += p.amount;
        modeTotals[p.mode] = (modeTotals[p.mode] || 0) + p.amount;
        allTx.push({ ...p, flatId: id });
      });
    });

    allTx.sort((a, b) => b.date.localeCompare(a.date));

    return {
      totalCollected,
      totalPending,
      flatsClear,
      totalFlats: Object.keys(flats).length,
      modeTotals,
      allTx,
    };
  }, [data, curMonth]);

  return {
    data,
    loading,
    saveError,
    curMonth,
    totals,
    recordPayment,
    deletePayment,
    saveRate,
    resetAll,
  };
}
