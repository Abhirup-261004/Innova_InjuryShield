import { useEffect, useMemo, useRef, useState } from "react";
import Front from "../assets/body-front.svg?react";
import Back from "../assets/body-back.svg?react";
import "../css/BodyMapPicker.css";

const ZONE_TO_PART = {
  "zone-shoulder": "shoulder",
  "zone-shoulder-r": "shoulder",
  "zone-elbow": "elbow",
  "zone-elbow-r": "elbow",
  "zone-knee": "knee",
  "zone-knee-r": "knee",
  "zone-ankle": "ankle",
  "zone-ankle-r": "ankle",
  "zone-hip": "hip",
  "zone-hip-r": "hip",
  "zone-lowerBack": "lowerBack",
};

const PART_LABEL = {
  shoulder: "Shoulder",
  elbow: "Elbow",
  knee: "Knee",
  ankle: "Ankle",
  hip: "Hip",
  lowerBack: "Lower Back",
};

export default function BodyMapPicker({ value, onChange }) {
  const [view, setView] = useState("front"); // front | back
  const wrapRef = useRef(null);

  const selectedLabel = useMemo(() => PART_LABEL[value] || value, [value]);

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const onClick = (e) => {
      const id = e.target?.id;
      if (!id) return;

      const part = ZONE_TO_PART[id];
      if (part) onChange(part);
    };

    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, [onChange]);

  return (
    <div className="bodymap-card">
      <div className="bodymap-header">
        <div>
          <h3>Body Map</h3>
          <p className="meta">Tap a body part to predict risk</p>
        </div>

        <div className="toggle">
          <button
            className={view === "front" ? "active" : ""}
            onClick={() => setView("front")}
            type="button"
          >
            Front
          </button>
          <button
            className={view === "back" ? "active" : ""}
            onClick={() => setView("back")}
            type="button"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bodymap-selected">
        Selected: <span className="pill">{selectedLabel}</span>
      </div>

      <div ref={wrapRef} className={`bodymap-wrap ${view}`} data-selected={value}>
        {/* SVG uses currentColor; we control colors via CSS */}
        {view === "front" ? <Front className="bodysvg" /> : <Back className="bodysvg" />}

        {/* Highlight overlay */}
        <div className="legend">
          <div className="dot" /> Clickable zones
        </div>
      </div>
    </div>
  );
}
