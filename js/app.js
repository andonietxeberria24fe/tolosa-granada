(() => {
  "use strict";

  // ==========================================
  // PARADAS Y MODOS
  // ==========================================

  const allStops = [
    { id: "tolosa", name: "Tolosa" },
    { id: "aizkorri", name: "Aizkorri" },
    { id: "obanos", name: "Óbanos" },
    { id: "oropesa", name: "Oropesa" },
    { id: "benidorm", name: "Benidorm" },
    { id: "granada", name: "Granada" }
  ];

  const directStops = [
    allStops[0],
    allStops[5]
  ];

  let currentMode = "real";
  let activeStops = [...allStops];
  let currentStopIndex = 0;
  let isTravelling = false;
  let animationFrame = null;

  // Duración aproximada del trayecto entre paradas.
  const TRAVEL_DURATION = 1800;

  // ==========================================
  // ELEMENTOS
  // ==========================================

  const stopList = document.getElementById("stop-list");
  const travelStatus = document.getElementById("travel-status");
  const vehicle = document.getElementById("vehicle");

  const continueButton = document.getElementById("continue-stop");
  const memoriesButton = document.getElementById("open-memory");

  const stopsPanel = document.getElementById("stops-panel");
  const openStopsButton = document.getElementById("open-stops");
  const closeStopsButton = document.getElementById("close-stops");

  const modeButtons = document.querySelectorAll(
    ".mode-button, .trip-option"
  );

  // ==========================================
  // UTILIDADES
  // ==========================================

  function getCurrentStop() {
    return activeStops[currentStopIndex] || activeStops[0];
  }

  function setStatus(message) {
    if (travelStatus) {
      travelStatus.textContent = message;
    }
  }

  function setButtonsDisabled(disabled) {
    if (continueButton) {
      continueButton.disabled = disabled;
    }

    if (memoriesButton) {
      memoriesButton.disabled = disabled;
    }
  }

  function updateStopCounter() {
    const counter = document.getElementById("stop-count");

    if (counter) {
      counter.textContent = `${currentStopIndex + 1}/${activeStops.length}`;
    }
  }

  // ==========================================
  // LISTA DE PARADAS
  // ==========================================

  function renderStops() {
    if (!stopList) return;

    stopList.replaceChildren();

    activeStops.forEach((stop, index) => {
      const item = document.createElement("li");
      item.className = "stop-item";

      if (index < currentStopIndex) {
        item.classList.add("stop-completed");
      }

      if (index === currentStopIndex) {
        item.classList.add("stop-current");
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "stop-button";
      button.textContent = stop.name;
      button.setAttribute(
        "aria-current",
        index === currentStopIndex ? "step" : "false"
      );

      // Permite seleccionar una parada de la lista.
      button.addEventListener("click", () => {
        if (isTravelling || index === currentStopIndex) return;

        currentStopIndex = index;
        updateCurrentStop();
        moveToCurrentStop();
      });

      item.appendChild(button);
      stopList.appendChild(item);
    });

    updateStopCounter();
  }

  function updateStopStates() {
    if (!stopList) return;

    const items = stopList.querySelectorAll(".stop-item");

    items.forEach((item, index) => {
      item.classList.toggle(
        "stop-completed",
        index < currentStopIndex
      );

      item.classList.toggle(
        "stop-current",
        index === currentStopIndex
      );

      const button = item.querySelector("button");

      if (button) {
        button.setAttribute(
          "aria-current",
          index === currentStopIndex ? "step" : "false"
        );
      }
    });

    updateStopCounter();
  }

  // ==========================================
  // ACTUALIZAR PARADA ACTUAL
  // ==========================================

  function updateCurrentStop() {
    const stop = getCurrentStop();

    if (!stop) return;

    updateStopStates();

    if (currentStopIndex === activeStops.length - 1) {
      setStatus(`Llegada a ${stop.name}`);
    } else {
      setStatus(`Parada actual: ${stop.name}`);
    }

    if (continueButton) {
      continueButton.disabled =
        isTravelling || currentStopIndex >= activeStops.length - 1;
    }

    if (memoriesButton) {
      memoriesButton.disabled = false;
    }
  }

  // ==========================================
  // MAPA Y POSICIÓN DEL VEHÍCULO
  // ==========================================

  function moveToCurrentStop() {
    if (!window.TripMap) return;

    const stop = getCurrentStop();

    if (!stop) return;

    if (typeof window.TripMap.getStopFraction === "function") {
      const fraction = window.TripMap.getStopFraction(stop.id);

      if (Number.isFinite(fraction)) {
        updateProgress(fraction);
      }
    }
  }

  function updateProgress(fraction) {
    if (!window.TripMap) return;

    const safeFraction = Math.max(0, Math.min(1, fraction));

    // Se actualizan el recorrido y el vehículo usando
    // exactamente la misma fracción.
    if (typeof window.TripMap.setProgress === "function") {
      window.TripMap.setProgress(0, safeFraction);
    }

    if (
      typeof window.TripMap.positionAtRouteFraction === "function"
    ) {
      const position =
        window.TripMap.positionAtRouteFraction(safeFraction);

      if (vehicle && position) {
        vehicle.style.left = `${position.x}px`;
        vehicle.style.top = `${position.y}px`;
      }
    }
  }

  // ==========================================
  // AVANZAR A LA SIGUIENTE PARADA
  // ==========================================

  function travelToStop(nextIndex) {
    if (isTravelling) return;

    if (
      nextIndex < 0 ||
      nextIndex >= activeStops.length ||
      nextIndex === currentStopIndex
    ) {
      return;
    }

    if (!window.TripMap) {
      setStatus("El mapa todavía se está cargando…");
      return;
    }

    const startIndex = currentStopIndex;
    const startStop = activeStops[startIndex];
    const targetStop = activeStops[nextIndex];

    const getFraction =
      window.TripMap.getStopFraction;

    if (typeof getFraction !== "function") {
      setStatus("No se ha podido iniciar el recorrido.");
      return;
    }

    const fromFraction = getFraction(startStop.id);
    const toFraction = getFraction(targetStop.id);

    if (
      !Number.isFinite(fromFraction) ||
      !Number.isFinite(toFraction)
    ) {
      setStatus("No se ha encontrado el tramo del recorrido.");
      return;
    }

    isTravelling = true;
    setButtonsDisabled(true);
    setStatus(`En camino a ${targetStop.name}…`);

    const startTime = performance.now();

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / TRAVEL_DURATION);

      // Interpolación lineal: línea y vehículo comparten
      // exactamente el mismo progreso en cada fotograma.
      const fraction =
        fromFraction + (toFraction - fromFraction) * progress;

      updateProgress(fraction);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      // Ajuste final exacto a la posición de la parada.
      updateProgress(toFraction);

      currentStopIndex = nextIndex;
      isTravelling = false;
      animationFrame = null;

      renderStops();
      updateCurrentStop();
    }

    animationFrame = requestAnimationFrame(animate);
  }

  // ==========================================
  // BOTONES INFERIORES
  // ==========================================

  if (continueButton) {
    continueButton.addEventListener("click", () => {
      if (isTravelling) return;

      const nextIndex = currentStopIndex + 1;

      if (nextIndex < activeStops.length) {
        travelToStop(nextIndex);
      } else {
        setStatus("¡Hemos llegado a Granada!");
      }
    });
  }

  if (memoriesButton) {
    memoriesButton.addEventListener("click", () => {
      const stop = getCurrentStop();

      if (!stop) return;

      if (
        window.TripGallery &&
        typeof window.TripGallery.openMemory === "function"
      ) {
        window.TripGallery.openMemory(stop.id);
      }
    });
  }

  // ==========================================
  // CAMBIAR MODO DE VIAJE
  // ==========================================

  function chooseMode(mode) {
    if (mode !== "direct" && mode !== "real") return;

    currentMode = mode;
    activeStops = mode === "direct"
      ? [...directStops]
      : [...allStops];

    currentStopIndex = 0;
    isTravelling = false;

    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    modeButtons.forEach(button => {
      const buttonMode =
        button.dataset.mode ||
        button.dataset.tripMode;

      button.classList.toggle(
        "selected",
        buttonMode === mode
      );

      button.classList.toggle(
        "active",
        buttonMode === mode
      );

      if (buttonMode === mode) {
        button.setAttribute("aria-pressed", "true");
      } else if (buttonMode) {
        button.setAttribute("aria-pressed", "false");
      }
    });

    if (window.TripMap) {
      if (typeof window.TripMap.drawRoute === "function") {
        window.TripMap.drawRoute(mode);
      }

      if (typeof window.TripMap.setMode === "function") {
        window.TripMap.setMode(mode);
      }
    }

    if (vehicle) {
      vehicle.textContent = mode === "direct" ? "✈️" : "🚙";
      vehicle.style.display = "";
    }

    renderStops();
    updateCurrentStop();
    moveToCurrentStop();
  }

  modeButtons.forEach(button => {
    button.addEventListener("click", () => {
      const mode =
        button.dataset.mode ||
        button.dataset.tripMode;

      if (mode) {
        chooseMode(mode);
      }
    });
  });

  // ==========================================
  // PANEL DE PARADAS
  // ==========================================

  function openStopsPanel() {
    if (!stopsPanel) return;

    stopsPanel.classList.add("open");
    stopsPanel.setAttribute("aria-hidden", "false");

    if (openStopsButton) {
      openStopsButton.setAttribute("aria-expanded", "true");
    }
  }

  function closeStopsPanel() {
    if (!stopsPanel) return;

    stopsPanel.classList.remove("open");
    stopsPanel.setAttribute("aria-hidden", "true");

    if (openStopsButton) {
      openStopsButton.setAttribute("aria-expanded", "false");
    }
  }

  if (openStopsButton) {
    openStopsButton.addEventListener("click", openStopsPanel);
  }

  if (closeStopsButton) {
    closeStopsButton.addEventListener("click", closeStopsPanel);
  }

  // ==========================================
  // INICIALIZACIÓN
  // ==========================================

  function initialize() {
    renderStops();
    updateCurrentStop();

    // Modo inicial: viaje de verdad.
    chooseMode("real");
  }

  // Espera a que map.js haya creado el mapa.
  let attempts = 0;
  const maxAttempts = 100;

  function waitForMap() {
    if (window.TripMap) {
      initialize();
      return;
    }

    attempts += 1;

    if (attempts < maxAttempts) {
      window.setTimeout(waitForMap, 100);
    } else {
      renderStops();
      updateCurrentStop();
      setStatus("No se ha podido cargar el mapa.");
      console.error("TripMap no está disponible.");
    }
  }

  waitForMap();

  // API pública opcional.
  window.TripApp = {
    chooseMode,
    travelToStop,
    getCurrentStop,
    getCurrentStopIndex: () => currentStopIndex
  };
})();
