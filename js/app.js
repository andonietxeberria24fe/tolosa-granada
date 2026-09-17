(() => {
  "use strict";

  const allStops = [
    { id: "tolosa", name: "Tolosa" },
    { id: "aizkorri", name: "Aizkorri" },
    { id: "obanos", name: "Óbanos" },
    { id: "oropesa", name: "Oropesa" },
    { id: "benidorm", name: "Benidorm" },
    { id: "granada", name: "Granada" }
  ];

  const directStops = [allStops[0], allStops[5]];

  let currentMode = "real";
  let activeStops = [...allStops];
  let currentStopIndex = 0;
  let isTravelling = false;
  let animationFrame = null;

  const TRAVEL_DURATION = 1800;

  const stopList = document.getElementById("stop-list");
  const travelStatus = document.getElementById("travel-status");
  const vehicle = document.getElementById("vehicle");
  const continueButton = document.getElementById("continue-stop");
  const memoriesButton = document.getElementById("open-memory");
  const stopsPanel = document.getElementById("stops-panel");
  const openStopsButton = document.getElementById("open-stops");
  const closeStopsButton = document.getElementById("close-stops");
  const memoryPanel = document.getElementById("memory-panel");
  const modeButtons = document.querySelectorAll(".mode-button, .trip-option");

  function getCurrentStop() {
    return activeStops[currentStopIndex] || activeStops[0];
  }

  function setStatus(message) {
    if (travelStatus) travelStatus.textContent = message;
  }

  function setButtonsDisabled(disabled) {
    if (continueButton) {
      continueButton.disabled =
        disabled || currentStopIndex >= activeStops.length - 1;
    }

    if (memoriesButton) memoriesButton.disabled = disabled;
  }

  function updateStopCounter() {
    const counter = document.getElementById("stop-count");
    if (counter) counter.textContent = `${currentStopIndex + 1}/${activeStops.length}`;
  }

  function renderStops() {
    if (!stopList) return;

    stopList.replaceChildren();

    activeStops.forEach((stop, index) => {
      const item = document.createElement("li");
      item.className = "stop-item";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "stop-button";
      button.textContent = stop.name;
      button.setAttribute("aria-current", index === currentStopIndex ? "step" : "false");

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
    updateStopStates();
  }

  function updateStopStates() {
    if (!stopList) return;

    stopList.querySelectorAll(".stop-item").forEach((item, index) => {
      item.classList.toggle("stop-completed", index < currentStopIndex);
      item.classList.toggle("stop-current", index === currentStopIndex);

      const button = item.querySelector("button");
      if (button) {
        button.setAttribute("aria-current", index === currentStopIndex ? "step" : "false");
      }
    });

    updateStopCounter();

    if (window.TripMap && typeof window.TripMap.updateStopStates === "function") {
      const visited = activeStops
        .slice(0, currentStopIndex)
        .map(stop => allStops.findIndex(item => item.id === stop.id))
        .filter(index => index >= 0);

      const currentGlobalIndex = allStops.findIndex(stop => stop.id === getCurrentStop().id);
      window.TripMap.updateStopStates(currentGlobalIndex, visited);
    }
  }

  function updateCurrentStop() {
    const stop = getCurrentStop();
    if (!stop) return;

    updateStopStates();

    setStatus(
      currentStopIndex === activeStops.length - 1
        ? `Llegada a ${stop.name}`
        : `Parada actual: ${stop.name}`
    );

    setButtonsDisabled(isTravelling);
  }

  function updateProgress(fraction) {
    if (!window.TripMap) return;

    const safeFraction = Math.max(0, Math.min(1, fraction));
    window.TripMap.setProgress(0, safeFraction);

    const position = window.TripMap.positionAtRouteFraction(safeFraction);
    if (vehicle && position) {
      vehicle.style.left = `${position.x}px`;
      vehicle.style.top = `${position.y}px`;
    }
  }

  function moveToCurrentStop() {
    if (!window.TripMap) return;

    const stop = getCurrentStop();
    if (!stop) return;

    const fraction = window.TripMap.getStopFraction(stop.id);
    if (Number.isFinite(fraction)) updateProgress(fraction);
  }

  function travelToStop(nextIndex) {
    if (isTravelling || !window.TripMap) return;
    if (nextIndex < 0 || nextIndex >= activeStops.length) return;

    const fromFraction = window.TripMap.getStopFraction(activeStops[currentStopIndex].id);
    const toFraction = window.TripMap.getStopFraction(activeStops[nextIndex].id);

    if (!Number.isFinite(fromFraction) || !Number.isFinite(toFraction)) {
      setStatus("No se ha encontrado el tramo del recorrido.");
      return;
    }

    isTravelling = true;
    setButtonsDisabled(true);
    setStatus(`En camino a ${activeStops[nextIndex].name}…`);

    const startTime = performance.now();

    function animate(now) {
      const progress = Math.min(1, (now - startTime) / TRAVEL_DURATION);
      const eased = progress * progress * (3 - 2 * progress);
      updateProgress(fromFraction + (toFraction - fromFraction) * eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
        return;
      }

      updateProgress(toFraction);
      currentStopIndex = nextIndex;
      isTravelling = false;
      animationFrame = null;

      renderStops();
      updateCurrentStop();
    }

    animationFrame = requestAnimationFrame(animate);
  }

  function continueTrip() {
    if (memoryPanel) {
      memoryPanel.classList.remove("open");
      memoryPanel.setAttribute("aria-hidden", "true");
    }

    if (currentStopIndex < activeStops.length - 1) {
      travelToStop(currentStopIndex + 1);
    } else {
      setStatus(`¡Hemos llegado a ${getCurrentStop().name}!`);
    }
  }

  if (continueButton) {
    continueButton.addEventListener("click", continueTrip);
  }

  if (memoriesButton) {
    memoriesButton.addEventListener("click", () => {
      const stop = getCurrentStop();

      if (stop && window.TripGallery) {
        window.TripGallery.openMemory(stop.id);
      }
    });
  }

  const continueTripButton = document.getElementById("continue-trip");
  if (continueTripButton) {
    continueTripButton.addEventListener("click", continueTrip);
  }

  function chooseMode(mode) {
    if (mode !== "direct" && mode !== "real") return;

    currentMode = mode;
    activeStops = mode === "direct" ? [...directStops] : [...allStops];
    currentStopIndex = 0;
    isTravelling = false;

    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    modeButtons.forEach(button => {
      const buttonMode = button.dataset.mode || button.dataset.tripMode;
      button.classList.toggle("active", buttonMode === mode);
      button.classList.toggle("selected", buttonMode === mode);

      if (buttonMode) {
        button.setAttribute("aria-pressed", String(buttonMode === mode));
      }
    });

    if (window.TripMap) {
      window.TripMap.drawRoute(mode);
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
      const mode = button.dataset.mode || button.dataset.tripMode;
      if (mode) chooseMode(mode);
    });
  });

  function openStopsPanel() {
    if (!stopsPanel) return;
    stopsPanel.classList.add("open");
    stopsPanel.setAttribute("aria-hidden", "false");
    if (openStopsButton) openStopsButton.setAttribute("aria-expanded", "true");
  }

  function closeStopsPanel() {
    if (!stopsPanel) return;
    stopsPanel.classList.remove("open");
    stopsPanel.setAttribute("aria-hidden", "true");
    if (openStopsButton) openStopsButton.setAttribute("aria-expanded", "false");
  }

  if (openStopsButton) openStopsButton.addEventListener("click", openStopsPanel);
  if (closeStopsButton) closeStopsButton.addEventListener("click", closeStopsPanel);

  function initialize() {
    renderStops();
    chooseMode("real");
  }

  let attempts = 0;

  function waitForMap() {
    if (window.TripMap && window.TripMap.ready) {
      initialize();
      return;
    }

    attempts++;

    if (attempts < 100) {
      window.setTimeout(waitForMap, 100);
    } else {
      renderStops();
      updateCurrentStop();
      setStatus("No se ha podido cargar el mapa.");
    }
  }

  waitForMap();

  window.TripApp = {
    chooseMode,
    travelToStop,
    getCurrentStop,
    getCurrentStopIndex: () => currentStopIndex
  };
})();
