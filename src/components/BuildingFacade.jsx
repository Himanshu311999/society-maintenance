import React from "react";
import { FLOORS, UNITS_PER_FLOOR } from "../constants";
import { flatId, flatStatus } from "../utils/flatUtils";

export default function BuildingFacade({ flats, settings, curMonth, selectedFlatId, onSelectFlat, search }) {
  const searchNorm = search.trim();

  return (
    <div className="mt-facade-wrap">
      <div className="mt-legend">
        <span className="mt-dot mt-c-clear"></span> Clear
        <span className="mt-dot mt-c-advance"></span> Advance
        <span className="mt-dot mt-c-due"></span> Due
        <span className="mt-dot mt-c-overdue"></span> Overdue
      </div>

      <div className="mt-facade">
        {Array.from({ length: FLOORS }, (_, i) => FLOORS - i).map((floor) => (
          <div className="mt-floor-row" key={floor}>
            <div className="mt-floor-tag">F{floor}</div>
            <div className="mt-units">
              {Array.from({ length: UNITS_PER_FLOOR }, (_, i) => i + 1).map((unit) => {
                const id = flatId(floor, unit);
                const flat = flats[id];
                const status = flatStatus(flat, settings.startMonth, curMonth);
                const isSel = selectedFlatId === id;
                const dim = searchNorm && !id.includes(searchNorm);
                return (
                  <button
                    key={id}
                    onClick={() => onSelectFlat(id)}
                    className={`mt-window mt-s-${status} ${isSel ? "mt-sel" : ""} ${dim ? "mt-dim" : ""}`}
                    title={flat ? `Flat ${id}` : `Flat ${id} — no data`}
                  >
                    {id}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        <div className="mt-ground">ENTRANCE</div>
      </div>
    </div>
  );
}
