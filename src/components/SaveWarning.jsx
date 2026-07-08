import React from "react";
import { AlertTriangle } from "lucide-react";

export default function SaveWarning() {
  return (
    <div className="mt-save-warning">
      <AlertTriangle size={14} /> Changes couldn't be saved to storage — they may not persist.
    </div>
  );
}
