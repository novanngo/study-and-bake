import React, { useState, useEffect, useRef, useCallback } from "react";

const CAFES = [
  {
    id: "paris",
    flag: "🇫🇷",
    name: "Paris",
    bg1: "#FBF2E6",
    bg2: "#F1D9C4",
    accent: "#C97B54",
    accentDark: "#8A4E2E",
    ambience: "Soft accordion, rain on cobblestone",
    recipes: [
      { id: "croissant", name: "Croissant", icon: "🥐", rarity: "Common" },
      { id: "baguette", name: "Baguette", icon: "🥖", rarity: "Common" },
      { id: "painchoc", name: "Pain au Chocolat", icon: "🍫", rarity: "Uncommon" },
      { id: "tarte", name: "Tarte aux Fruits", icon: "🥧", rarity: "Rare" },
    ],
  },
  {
    id: "japan",
    flag: "🇯🇵",
    name: "Japan",
    bg1: "#F2F1E6",
    bg2: "#D9E1CE",
    accent: "#748C67",
    accentDark: "#465A3C",
    ambience: "Lo-fi shop tape, rain on paper lanterns",
    recipes: [
      { id: "matcha", name: "Matcha Cake", icon: "🍵", rarity: "Uncommon" },
      { id: "mochi", name: "Mochi", icon: "🍡", rarity: "Common" },
      { id: "onigiri", name: "Onigiri", icon: "🍙", rarity: "Common" },
      { id: "taiyaki", name: "Taiyaki", icon: "🐟", rarity: "Rare" },
    ],
  },
  {
    id: "vietnam",
    flag: "🇻🇳",
    name: "Vietnam",
    bg1: "#FCEDE7",
    bg2: "#F3CFC2",
    accent: "#D9765C",
    accentDark: "#93412C",
    ambience: "Scooters outside, warm café chatter",
    recipes: [
      { id: "banhmi", name: "Bánh Mì", icon: "🥪", rarity: "Common" },
      { id: "eggcoffee", name: "Egg Coffee", icon: "☕", rarity: "Uncommon" },
      { id: "eggtart", name: "Egg Tart", icon: "🥮", rarity: "Uncommon" },
      { id: "springroll", name: "Spring Rolls", icon: "🌯", rarity: "Rare" },
    ],
  },
  {
    id: "mexico",
    flag: "🇲🇽",
    name: "Mexico",
    bg1: "#FDF1DD",
    bg2: "#F3D49B",
    accent: "#D98A33",
    accentDark: "#8F571A",
    ambience: "Acoustic guitar, golden hour breeze",
    recipes: [
      { id: "pandulce", name: "Pan Dulce", icon: "🍞", rarity: "Common" },
      { id: "churro", name: "Churros", icon: "🥨", rarity: "Common" },
      { id: "flan", name: "Flan", icon: "🍮", rarity: "Uncommon" },
      { id: "cake", name: "Tres Leches", icon: "🎂", rarity: "Rare" },
    ],
  },
];

const DURATIONS = [15, 25, 45, 60, 90, 120];

const RARITY_STYLE = {
  Common: { label: "Common" },
  Uncommon: { label: "Uncommon" },
  Rare: { label: "Rare" },
};

function loadFonts() {
  if (document.getElementById("sb-fonts")) return;
  const link = document.createElement("link");
  link.id = "sb-fonts";
  link.rel = "stylesheet";
  link.href =
    "https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&family=Nunito:wght@400;600;700&display=swap";
  document.head.appendChild(link);
}

export default function StudyBakery() {
  const [cafeId, setCafeId] = useState("paris");
  const [screen, setScreen] = useState("select"); // select | baking | done
  const [recipeId, setRecipeId] = useState(null);
  const [duration, setDuration] = useState(25);
  const [remaining, setRemaining] = useState(0);
  const [paused, setPaused] = useState(false);
  const [collection, setCollection] = useState([]);
  const [xp, setXp] = useState(0);
  const [justFinished, setJustFinished] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const intervalRef = useRef(null);

  const cafe = CAFES.find((c) => c.id === cafeId);
  const recipe = cafe.recipes.find((r) => r.id === recipeId) || cafe.recipes[0];

  useEffect(() => {
    loadFonts();
  }, []);

  // load persisted collection
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("study-bakery-collection", false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          setCollection(parsed.collection || []);
          setXp(parsed.xp || 0);
        }
      } catch (e) {
        // no saved data yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (nextCollection, nextXp) => {
    try {
      await window.storage.set(
        "study-bakery-collection",
        JSON.stringify({ collection: nextCollection, xp: nextXp }),
        false
      );
    } catch (e) {
      // storage unavailable, demo still works in-memory
    }
  }, []);

  useEffect(() => {
    if (screen !== "baking" || paused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(intervalRef.current);
          finishBake();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, paused]);

  function startBake() {
    setRemaining(duration); // demo speed: 1 real second = 1 study minute
    setPaused(false);
    setScreen("baking");
  }

  function finishBake() {
    const entry = {
      id: `${recipe.id}-${Date.now()}`,
      recipeId: recipe.id,
      name: recipe.name,
      icon: recipe.icon,
      cafe: cafe.name,
      flag: cafe.flag,
      minutes: duration,
    };
    const nextCollection = [entry, ...collection].slice(0, 24);
    const nextXp = xp + 10;
    setCollection(nextCollection);
    setXp(nextXp);
    persist(nextCollection, nextXp);
    setJustFinished(entry);
    setScreen("done");
  }

  function cancelBake() {
    clearInterval(intervalRef.current);
    setPaused(false);
    setScreen("select");
  }

  function bakeAgain() {
    setJustFinished(null);
    setScreen("select");
  }

  const totalSeconds = duration;
  const progress = totalSeconds ? 1 - remaining / totalSeconds : 0;
  const level = Math.floor(xp / 50) + 1;
  const xpIntoLevel = xp % 50;

  const themeVars = {
    "--accent": cafe.accent,
    "--accent-dark": cafe.accentDark,
    "--bg1": cafe.bg1,
    "--bg2": cafe.bg2,
  };

  return (
    <div className="sb-root" style={themeVars}>
      <style>{`
        .sb-root {
          --cream: #FBF3E7;
          --brown: #6B4A34;
          --brown-soft: #8B6B52;
          font-family: 'Nunito', sans-serif;
          background: linear-gradient(160deg, var(--bg1), var(--bg2));
          border-radius: 20px;
          padding: 28px 24px 32px;
          color: var(--brown);
          transition: background 700ms ease;
          overflow: hidden;
          position: relative;
        }
        .sb-title {
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
        }
        .sb-topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 22px;
        }
        .sb-wordmark {
          font-size: 22px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sb-cafes {
          display: flex;
          gap: 6px;
          background: rgba(255,255,255,0.5);
          padding: 5px;
          border-radius: 999px;
        }
        .sb-cafe-btn {
          border: none;
          background: transparent;
          padding: 7px 13px;
          border-radius: 999px;
          font-family: 'Nunito', sans-serif;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          color: var(--brown-soft);
          transition: all 200ms ease;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }
        .sb-cafe-btn.active {
          background: var(--accent);
          color: white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .sb-cafe-btn:not(.active):hover {
          background: rgba(255,255,255,0.7);
        }
        .sb-stage {
          background: rgba(255,255,255,0.55);
          border-radius: 18px;
          padding: 26px;
          backdrop-filter: blur(2px);
        }
        .sb-panel-title {
          font-size: 18px;
          margin: 0 0 4px;
        }
        .sb-panel-sub {
          font-size: 13px;
          color: var(--brown-soft);
          margin: 0 0 18px;
        }
        .sb-recipe-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
          gap: 10px;
          margin-bottom: 22px;
        }
        .sb-recipe-card {
          border: 2px solid transparent;
          background: white;
          border-radius: 14px;
          padding: 14px 8px;
          text-align: center;
          cursor: pointer;
          transition: all 180ms ease;
          font-family: 'Nunito', sans-serif;
        }
        .sb-recipe-card:hover {
          transform: translateY(-2px);
        }
        .sb-recipe-card.active {
          border-color: var(--accent);
          box-shadow: 0 4px 10px rgba(0,0,0,0.08);
        }
        .sb-recipe-icon {
          font-size: 30px;
          display: block;
          margin-bottom: 6px;
        }
        .sb-recipe-name {
          font-size: 12.5px;
          font-weight: 700;
          color: var(--brown);
        }
        .sb-recipe-rarity {
          font-size: 10px;
          color: var(--brown-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .sb-durations {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 24px;
        }
        .sb-duration-btn {
          border: 2px solid rgba(0,0,0,0.06);
          background: white;
          padding: 9px 14px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          color: var(--brown-soft);
        }
        .sb-duration-btn.active {
          border-color: var(--accent);
          color: var(--accent-dark);
          background: color-mix(in srgb, var(--accent) 12%, white);
        }
        .sb-start-btn {
          border: none;
          background: var(--accent);
          color: white;
          font-family: 'Fredoka', sans-serif;
          font-weight: 600;
          font-size: 15px;
          padding: 12px 26px;
          border-radius: 999px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: transform 150ms ease;
        }
        .sb-start-btn:hover { transform: scale(1.03); }
        .sb-start-btn:active { transform: scale(0.98); }

        .sb-oven-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px 0 6px;
        }
        .sb-oven {
          position: relative;
          width: 220px;
          height: 190px;
          background: linear-gradient(180deg, #A9714B, #7C4E30);
          border-radius: 26px 26px 18px 18px;
          box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        }
        .sb-oven-knob {
          position: absolute;
          top: 14px;
          right: 18px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #F1D9B8;
          box-shadow: inset 0 0 0 2px rgba(0,0,0,0.15);
        }
        .sb-oven-window {
          position: absolute;
          top: 38px;
          left: 50%;
          transform: translateX(-50%);
          width: 140px;
          height: 110px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 60%, #3B2417, #1E140D);
          box-shadow: inset 0 0 0 8px #5B3A24, inset 0 0 22px rgba(0,0,0,0.6);
          overflow: hidden;
        }
        .sb-oven-glow {
          position: absolute;
          inset: 8px;
          border-radius: 50%;
          background: radial-gradient(circle at 50% 65%, rgba(255,170,80,var(--glow,0.15)), transparent 70%);
          transition: background 400ms ease;
        }
        .sb-baking-icon {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%,-50%) scale(var(--bake-scale, 0.9));
          font-size: 44px;
          filter: brightness(0.95) saturate(1.05);
          transition: transform 600ms ease;
        }
        .sb-oven-legs {
          position: absolute;
          bottom: -10px;
          left: 24px;
          right: 24px;
          display: flex;
          justify-content: space-between;
        }
        .sb-oven-leg {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          background: #5B3A24;
        }
        .sb-steam {
          position: absolute;
          bottom: 92%;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: rgba(255,255,255,0.65);
          opacity: 0;
          animation: sb-rise 3.4s ease-in infinite;
        }
        @keyframes sb-rise {
          0% { opacity: 0; transform: translateY(0) scale(0.6); }
          15% { opacity: 0.7; }
          85% { opacity: 0.15; }
          100% { opacity: 0; transform: translateY(-90px) scale(1.3); }
        }
        .sb-progress-track {
          width: 260px;
          height: 10px;
          border-radius: 999px;
          background: rgba(0,0,0,0.08);
          margin: 22px 0 6px;
          overflow: hidden;
        }
        .sb-progress-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 999px;
          transition: width 1s linear;
        }
        .sb-timer-label {
          font-family: 'Fredoka', sans-serif;
          font-size: 22px;
          margin-top: 6px;
        }
        .sb-bake-sub {
          font-size: 12.5px;
          color: var(--brown-soft);
          margin-bottom: 4px;
        }
        .sb-bake-controls {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .sb-ctrl-btn {
          border: 2px solid rgba(0,0,0,0.08);
          background: white;
          padding: 9px 18px;
          border-radius: 999px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          color: var(--brown);
        }
        .sb-ctrl-btn.primary {
          background: var(--accent);
          color: white;
          border-color: var(--accent);
        }
        .sb-ctrl-btn.danger {
          color: #A34848;
        }

        .sb-done-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 10px 0 4px;
        }
        .sb-done-icon {
          font-size: 64px;
          animation: sb-pop 700ms ease;
        }
        @keyframes sb-pop {
          0% { transform: scale(0.3) rotate(-8deg); opacity: 0; }
          60% { transform: scale(1.12) rotate(4deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); }
        }
        .sb-confetti {
          position: absolute;
          top: -10px;
          font-size: 14px;
          animation: sb-fall linear forwards;
        }
        @keyframes sb-fall {
          to { transform: translateY(220px) rotate(200deg); opacity: 0; }
        }
        .sb-done-title {
          font-size: 20px;
          margin: 12px 0 2px;
        }
        .sb-done-sub {
          font-size: 13px;
          color: var(--brown-soft);
          margin-bottom: 18px;
        }

        .sb-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 20px;
          flex-wrap: wrap;
        }
        .sb-shelf-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--brown-soft);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
        }
        .sb-shelf {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 4px;
          max-width: 420px;
        }
        .sb-shelf-item {
          flex: 0 0 auto;
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 19px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.08);
        }
        .sb-shelf-empty {
          font-size: 12.5px;
          color: var(--brown-soft);
        }
        .sb-level {
          text-align: right;
          min-width: 150px;
        }
        .sb-level-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--brown-soft);
        }
        .sb-level-bar {
          width: 150px;
          height: 8px;
          border-radius: 999px;
          background: rgba(0,0,0,0.08);
          margin-top: 6px;
          overflow: hidden;
        }
        .sb-level-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 999px;
          transition: width 500ms ease;
        }
        .sb-ambience {
          font-size: 11.5px;
          color: var(--brown-soft);
          margin-top: 4px;
        }
      `}</style>

      <div className="sb-topbar">
        <div className="sb-wordmark sb-title">
          🧁 Study Bakery
        </div>
        <div className="sb-cafes">
          {CAFES.map((c) => (
            <button
              key={c.id}
              className={"sb-cafe-btn" + (c.id === cafeId ? " active" : "")}
              onClick={() => {
                setCafeId(c.id);
                setRecipeId(null);
              }}
            >
              <span>{c.flag}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="sb-stage">
        {screen === "select" && (
          <div>
            <p className="sb-panel-title sb-title">What should we bake?</p>
            <p className="sb-panel-sub">
              {cafe.name} café · {cafe.ambience}
            </p>
            <div className="sb-recipe-grid">
              {cafe.recipes.map((r) => (
                <div
                  key={r.id}
                  className={"sb-recipe-card" + (r.id === recipe.id ? " active" : "")}
                  onClick={() => setRecipeId(r.id)}
                >
                  <span className="sb-recipe-icon">{r.icon}</span>
                  <span className="sb-recipe-name">{r.name}</span>
                  <div className="sb-recipe-rarity">{RARITY_STYLE[r.rarity].label}</div>
                </div>
              ))}
            </div>

            <p className="sb-panel-sub" style={{ marginBottom: 8 }}>
              Study duration (demo runs at 1 second per minute)
            </p>
            <div className="sb-durations">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  className={"sb-duration-btn" + (d === duration ? " active" : "")}
                  onClick={() => setDuration(d)}
                >
                  {d} min
                </button>
              ))}
            </div>

            <button className="sb-start-btn" onClick={startBake}>
              Start baking →
            </button>
          </div>
        )}

        {screen === "baking" && (
          <div className="sb-oven-wrap">
            <p className="sb-panel-title sb-title" style={{ marginBottom: 2 }}>
              Baking {recipe.name}
            </p>
            <p className="sb-bake-sub">{cafe.flag} {cafe.name} café</p>

            <div className="sb-oven">
              <div className="sb-oven-knob" />
              <div className="sb-oven-window">
                <div
                  className="sb-oven-glow"
                  style={{ "--glow": 0.15 + progress * 0.55 }}
                />
                <div
                  className="sb-baking-icon"
                  style={{ "--bake-scale": 0.85 + progress * 0.3 }}
                >
                  {recipe.icon}
                </div>
                {!paused &&
                  [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="sb-steam"
                      style={{
                        left: `${34 + i * 22}%`,
                        animationDelay: `${i * 1.1}s`,
                      }}
                    />
                  ))}
              </div>
              <div className="sb-oven-legs">
                <div className="sb-oven-leg" />
                <div className="sb-oven-leg" />
              </div>
            </div>

            <div className="sb-progress-track">
              <div
                className="sb-progress-fill"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="sb-timer-label sb-title">
              {remaining}s left {paused ? "· paused" : ""}
            </div>

            <div className="sb-bake-controls">
              <button className="sb-ctrl-btn" onClick={cancelBake}>
                Cancel
              </button>
              <button
                className="sb-ctrl-btn primary"
                onClick={() => setPaused((p) => !p)}
              >
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
          </div>
        )}

        {screen === "done" && justFinished && (
          <div className="sb-done-wrap">
            {[...Array(10)].map((_, i) => (
              <span
                key={i}
                className="sb-confetti"
                style={{
                  left: `${8 + i * 9}%`,
                  animationDuration: `${1.4 + (i % 4) * 0.3}s`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {["✨", "🎉", "🌸", "⭐"][i % 4]}
              </span>
            ))}
            <div className="sb-done-icon">{justFinished.icon}</div>
            <p className="sb-done-title sb-title">{justFinished.name} is ready!</p>
            <p className="sb-done-sub">
              +10 XP · added to your recipe collection
            </p>
            <button className="sb-start-btn" onClick={bakeAgain}>
              Bake something else
            </button>
          </div>
        )}
      </div>

      <div className="sb-footer">
        <div>
          <div className="sb-shelf-label">Your collection ({collection.length})</div>
          <div className="sb-shelf">
            {collection.length === 0 && (
              <span className="sb-shelf-empty">Nothing baked yet — finish a session to fill the shelf.</span>
            )}
            {collection.map((item) => (
              <div key={item.id} className="sb-shelf-item" title={`${item.name} · ${item.cafe}`}>
                {item.icon}
              </div>
            ))}
          </div>
        </div>
        <div className="sb-level">
          <div className="sb-level-label">Level {level} · {xp} XP</div>
          <div className="sb-level-bar">
            <div className="sb-level-fill" style={{ width: `${(xpIntoLevel / 50) * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
