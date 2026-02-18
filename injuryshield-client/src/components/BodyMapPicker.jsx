import { useEffect, useMemo, useRef, useState } from "react";
import "../css/BodyMapPicker.css";

const ZONE_TO_PART = {
  "zone-shoulders-l": "shoulders",
  "zone-shoulders-r": "shoulders",
  "zone-biceps-l": "biceps",
  "zone-biceps-r": "biceps",
  "zone-triceps-l": "triceps",
  "zone-triceps-r": "triceps",
  "zone-forearms-l": "forearms",
  "zone-forearms-r": "forearms",
  "zone-chest": "chest",
  "zone-abs": "abs",
  "zone-upperBack": "upperBack",
  "zone-lowerBack": "lowerBack",
  "zone-glutes": "glutes",
  "zone-quads-l": "quads",
  "zone-quads-r": "quads",
  "zone-hamstrings-l": "hamstrings",
  "zone-hamstrings-r": "hamstrings",
  "zone-calves-l": "calves",
  "zone-calves-r": "calves",
};

const PART_LABEL = {
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  chest: "Chest",
  abs: "Abs",
  upperBack: "Upper Back",
  lowerBack: "Lower Back",
  glutes: "Glutes",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  calves: "Calves",
};

export default function BodyMapPicker({ value, onChange }) {
  const [view, setView] = useState("front");
  const wrapRef = useRef(null);

  const selectedLabel = useMemo(
    () => PART_LABEL[value] || "None",
    [value]
  );

  useEffect(() => {
    const root = wrapRef.current;
    if (!root) return;

    const onClick = (e) => {
      const el = e.target.closest("[id^='zone-']");
      if (!el) return;
      const part = ZONE_TO_PART[el.id];
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
        <svg
          className="bodysvg"
          viewBox="0 0 400 600"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Silhouette */}
          <path
            d="M200 50 C180 50 165 65 165 85 L165 120 C165 130 170 140 180 145 
               L180 200 C180 210 175 220 170 225 L165 250 
               C160 260 155 270 155 285 L155 400 
               C155 410 160 420 170 425 L170 480 
               C170 490 165 500 160 505 L155 530 
               C150 540 145 550 145 565 L145 590 
               C145 595 150 600 155 600 L245 600 
               C250 600 255 595 255 590 L255 565 
               C255 550 250 540 245 530 L240 505 
               C235 500 230 490 230 480 L230 425 
               C240 420 245 410 245 400 L245 285 
               C245 270 240 260 235 250 L230 225 
               C235 220 240 210 240 200 L240 145 
               C230 140 225 130 225 120 L225 85 
               C225 65 210 50 200 50 Z"
            fill="rgba(156,163,175,0.08)"
            stroke="rgba(156,163,175,0.15)"
            strokeWidth="1"
          />

          {/* FRONT VIEW */}
          {view === "front" && (
            <>
              <rect id="zone-shoulders-l" x="130" y="70" width="40" height="40" />
              <rect id="zone-shoulders-r" x="230" y="70" width="40" height="40" />
              <rect id="zone-biceps-l" x="135" y="120" width="35" height="40" />
              <rect id="zone-biceps-r" x="230" y="120" width="35" height="40" />
              <rect id="zone-forearms-l" x="130" y="170" width="30" height="50" />
              <rect id="zone-forearms-r" x="240" y="170" width="30" height="50" />
              <rect id="zone-chest" x="165" y="120" width="70" height="60" />
              <rect id="zone-abs" x="175" y="190" width="50" height="70" />
              <rect id="zone-quads-l" x="155" y="270" width="40" height="100" />
              <rect id="zone-quads-r" x="205" y="270" width="40" height="100" />
              <rect id="zone-calves-l" x="155" y="420" width="40" height="100" />
              <rect id="zone-calves-r" x="205" y="420" width="40" height="100" />
            </>
          )}

          {/* BACK VIEW */}
          {view === "back" && (
            <>
              <rect id="zone-upperBack" x="165" y="120" width="70" height="80" />
              <rect id="zone-lowerBack" x="175" y="210" width="50" height="70" />
              <rect id="zone-triceps-l" x="130" y="120" width="35" height="40" />
              <rect id="zone-triceps-r" x="235" y="120" width="35" height="40" />
              <rect id="zone-glutes" x="170" y="300" width="60" height="60" />
              <rect id="zone-hamstrings-l" x="155" y="370" width="40" height="100" />
              <rect id="zone-hamstrings-r" x="205" y="370" width="40" height="100" />
              <rect id="zone-calves-l" x="155" y="490" width="40" height="80" />
              <rect id="zone-calves-r" x="205" y="490" width="40" height="80" />
            </>
          )}
        </svg>

        <div className="legend">
          <div className="dot" /> Clickable zones
        </div>
      </div>
    </div>
  );
}
