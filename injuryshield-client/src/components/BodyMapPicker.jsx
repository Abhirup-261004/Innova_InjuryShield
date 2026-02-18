import { useEffect, useMemo, useRef, useState } from "react";
import "../css/BodyMapPicker.css";

const ZONE_TO_PART = {
  // Legacy zones for backward compatibility
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
  
  // New detailed muscle groups
  "zone-shoulders": "shoulders",
  "zone-shoulders-l": "shoulders",
  "zone-shoulders-r": "shoulders",
  "zone-biceps": "biceps",
  "zone-biceps-l": "biceps",
  "zone-biceps-r": "biceps",
  "zone-triceps": "triceps",
  "zone-triceps-l": "triceps",
  "zone-triceps-r": "triceps",
  "zone-forearms": "forearms",
  "zone-forearms-l": "forearms",
  "zone-forearms-r": "forearms",
  "zone-chest": "chest",
  "zone-abs": "abs",
  "zone-upperBack": "upperBack",
  "zone-glutes": "glutes",
  "zone-quads": "quads",
  "zone-quads-l": "quads",
  "zone-quads-r": "quads",
  "zone-hamstrings": "hamstrings",
  "zone-hamstrings-l": "hamstrings",
  "zone-hamstrings-r": "hamstrings",
  "zone-calves": "calves",
  "zone-calves-l": "calves",
  "zone-calves-r": "calves",
};

const PART_LABEL = {
  // Legacy labels
  shoulder: "Shoulder",
  elbow: "Elbow",
  knee: "Knee",
  ankle: "Ankle",
  hip: "Hip",
  lowerBack: "Lower Back",
  
  // New muscle group labels
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  chest: "Chest",
  abs: "Abs",
  upperBack: "Upper Back",
  glutes: "Glutes",
  quads: "Quadriceps",
  hamstrings: "Hamstrings",
  calves: "Calves",
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
        {/* Detailed anatomical SVG */}
        <svg className="bodysvg" viewBox="0 0 400 600" xmlns="http://www.w3.org/2000/svg">
          {view === "front" ? (
            <>
              {/* Base body silhouette */}
              <path d="M200 50 C180 50 165 65 165 85 L165 120 C165 130 170 140 180 145 L180 200 C180 210 175 220 170 225 L165 250 C160 260 155 270 155 285 L155 400 C155 410 160 420 170 425 L170 480 C170 490 165 500 160 505 L155 530 C150 540 145 550 145 565 L145 590 C145 595 150 600 155 600 L245 600 C250 600 255 595 255 590 L255 565 C255 550 250 540 245 530 L240 505 C235 500 230 490 230 480 L230 425 C240 420 245 410 245 400 L245 285 C245 270 240 260 235 250 L230 225 C235 220 240 210 240 200 L240 145 C230 140 225 130 225 120 L225 85 C225 65 210 50 200 50 Z" fill="rgba(156,163,175,0.08)" stroke="rgba(156,163,175,0.15)" strokeWidth="1"/> 145 C230 140 225 130 225 120 L225 85 C225 65 210 50 200 50 Z" fill="rgba(156,163,175,0.08)" stroke="rgba(156,163,175,0.15)" strokeWidth="1"/> 145 C170 140 175 130 175 120 L175 85 C175 65 190 50 210 50 L200 50 Z M200 50 C220 50 235 65 235 85 L235 120 C235 130 230 140 220 145 L220 200 C220 210 225 220 230 225 L235 250 C240 260 245 270 245 285 L245 400 C245 410 240 420 230 425 L230 480 C230 490 235 500 240 505 L245 530 C250 540 255 550 255 565 L255 590 C255 595 250 600 245 600 L215 600 C210 600 205 595 205 590 L205 565 C205 550 210 540 215 530 L220 505 C225 500 230 490 230 480 L230 425 C220 420 215 410 215 400 L215 285 C215 270 220 260 225 250 L230 225 C235 220 240 210 240 200 L240 145 C230 140 225 130 225 120 L225 85 C225 65 210 50 190 50 L200 50 Z" fill="#374151" fillOpacity="0.8"/>
              
              {/* Shoulders */}
              <path id="zone-shoulders-l" d="M160 85 C155 80 150 75 145 75 C140 75 135 80 135 85 C135 95 140 105 150 110 L165 115 C170 117 175 115 175 110 L175 95 C175 90 170 85 165 85 L160 85 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-shoulders-r" d="M240 85 C245 80 250 75 255 75 C260 75 265 80 265 85 C265 95 260 105 250 110 L235 115 C230 117 225 115 225 110 L225 95 C225 90 230 85 235 85 L240 85 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Biceps */}
              <path id="zone-biceps-l" d="M155 120 C150 125 145 135 145 145 C145 155 150 165 160 170 C165 172 170 170 170 165 L170 135 C170 130 165 125 160 125 L155 120 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-biceps-r" d="M245 120 C250 125 255 135 255 145 C255 155 250 165 240 170 C235 172 230 170 230 165 L230 135 C230 130 235 125 240 125 L245 120 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Forearms */}
              <path id="zone-forearms-l" d="M145 170 C140 175 135 185 135 195 C135 205 140 215 150 220 C155 222 160 220 160 215 L160 185 C160 180 155 175 150 175 L145 170 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-forearms-r" d="M255 170 C260 175 265 185 265 195 C265 205 260 215 250 220 C245 222 240 220 240 215 L240 185 C240 180 245 175 250 175 L255 170 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Chest */}
              <path id="zone-chest" d="M175 120 C175 115 180 110 185 110 L215 110 C220 110 225 115 225 120 L225 160 C225 170 220 175 215 175 L185 175 C180 175 175 170 175 160 L175 120 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Abs */}
              <path id="zone-abs" d="M185 180 C185 175 190 175 195 175 L205 175 C210 175 215 175 215 180 L215 240 C215 250 210 255 205 255 L195 255 C190 255 185 250 185 240 L185 180 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Quads */}
              <path id="zone-quads-l" d="M165 270 C160 275 155 285 155 300 L155 380 C155 390 160 395 165 395 C170 395 175 390 175 380 L175 300 C175 285 170 275 165 270 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-quads-r" d="M235 270 C240 275 245 285 245 300 L245 380 C245 390 240 395 235 395 C230 395 225 390 225 380 L225 300 C225 285 230 275 235 270 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Calves */}
              <path id="zone-calves-l" d="M165 420 C160 425 155 435 155 450 L155 520 C155 530 160 535 165 535 C170 535 175 530 175 520 L175 450 C175 435 170 425 165 420 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-calves-r" d="M235 420 C240 425 245 435 245 450 L245 520 C245 530 240 535 235 535 C230 535 225 530 225 520 L225 450 C225 435 230 425 235 420 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
            </>
          ) : (
            <>
              {/* Base body silhouette (back view) */}
              <path d="M200 50 C180 50 165 65 165 85 L165 120 C165 130 170 140 180 145 L180 200 C180 210 175 220 170 225 L165 250 C160 260 155 270 155 285 L155 400 C155 410 160 420 170 425 L170 480 C170 490 165 500 160 505 L155 530 C150 540 145 550 145 565 L145 590 C145 595 150 600 155 600 L245 600 C250 600 255 595 255 590 L255 565 C255 550 250 540 245 530 L240 505 C235 500 230 490 230 480 L230 425 C240 420 245 410 245 400 L245 285 C245 270 240 260 235 250 L230 225 C235 220 240 210 240 200 L240 145 C230 140 225 130 225 120 L225 85 C225 65 210 50 200 50 Z" fill="rgba(156,163,175,0.08)" stroke="rgba(156,163,175,0.15)" strokeWidth="1"/> 145 C230 140 225 130 225 120 L225 85 C225 65 210 50 200 50 Z" fill="rgba(156,163,175,0.08)" stroke="rgba(156,163,175,0.15)" strokeWidth="1"/> 145 C170 140 175 130 175 120 L175 85 C175 65 190 50 210 50 L200 50 Z M200 50 C220 50 235 65 235 85 L235 120 C235 130 230 140 220 145 L220 200 C220 210 225 220 230 225 L235 250 C240 260 245 270 245 285 L245 400 C245 410 240 420 230 425 L230 480 C230 490 235 500 240 505 L245 530 C250 540 255 550 255 565 L255 590 C255 595 250 600 245 600 L215 600 C210 600 205 595 205 590 L205 565 C205 550 210 540 215 530 L220 505 C225 500 230 490 230 480 L230 425 C220 420 215 410 215 400 L215 285 C215 270 220 260 225 250 L230 225 C235 220 240 210 240 200 L240 145 C230 140 225 130 225 120 L225 85 C225 65 210 50 190 50 L200 50 Z" fill="#374151" fillOpacity="0.8"/>
              
              {/* Upper Back */}
              <path id="zone-upperBack" d="M175 120 C175 115 180 110 185 110 L215 110 C220 110 225 115 225 120 L225 200 C225 210 220 215 215 215 L185 215 C180 215 175 210 175 200 L175 120 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Lower Back */}
              <path id="zone-lowerBack" d="M185 220 C185 215 190 215 195 215 L205 215 C210 215 215 215 215 220 L215 280 C215 290 210 295 205 295 L195 295 C190 295 185 290 185 280 L185 220 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Triceps */}
              <path id="zone-triceps-l" d="M145 120 C140 125 135 135 135 145 C135 155 140 165 150 170 C155 172 160 170 160 165 L160 135 C160 130 155 125 150 125 L145 120 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-triceps-r" d="M255 120 C260 125 265 135 265 145 C265 155 260 165 250 170 C245 172 240 170 240 165 L240 135 C240 130 245 125 250 125 L255 120 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Glutes */}
              <path id="zone-glutes" d="M175 300 C175 295 180 295 185 295 L215 295 C220 295 225 295 225 300 L225 350 C225 360 220 365 215 365 L185 365 C180 365 175 360 175 350 L175 300 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Hamstrings */}
              <path id="zone-hamstrings-l" d="M165 370 C160 375 155 385 155 400 L155 470 C155 480 160 485 165 485 C170 485 175 480 175 470 L175 400 C175 385 170 375 165 370 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-hamstrings-r" d="M235 370 C240 375 245 385 245 400 L245 470 C245 480 240 485 235 485 C230 485 225 480 225 470 L225 400 C225 385 230 375 235 370 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              
              {/* Calves (back view) */}
              <path id="zone-calves-l" d="M165 490 C160 495 155 505 155 520 L155 570 C155 580 160 585 165 585 C170 585 175 580 175 570 L175 520 C175 505 170 495 165 490 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
              <path id="zone-calves-r" d="M235 490 C240 495 245 505 245 520 L245 570 C245 580 240 585 235 585 C230 585 225 580 225 570 L225 520 C225 505 230 495 235 490 Z" fill="rgba(59,130,246,0.1)" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
            </>
          )}
        </svg>

        {/* Highlight overlay */}
        <div className="legend">
          <div className="dot" /> Clickable zones
        </div>
      </div>
    </div>
  );
}
