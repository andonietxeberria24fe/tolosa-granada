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

  // Fracción aproximada del recorrido donde se encuentra cada parada.
  const roadFractions = [0, 0.13, 0.25, 0.53, 0.70, 1];
  const directFractions = [0, 1];

  const list = document.getElementById("stop-list");
  const panel = document.getElementById("stops-panel");
  const openStopsButton = document.getElementById("open-stops");
  const closeStopsButton = document.getElementById("close-stops");
  const stopCount = document.getElementById("stop-count");
  const vehicle = document.getElementById("vehicle");
  const status = document.getElementById("travel-status");
  const continueButton = document.getElementById("continue-trip");

  let mode = "real";
  let visibleStops = allStops;
  let currentStop = 0;
  let visited = [];
  let animationFrame = null;
  let isMoving = false;

  const mapReady = () => Boolean(window.TripMap);

  function isMobile() {
    return window.matchMedia("(max-width: 760px)").matches;
  }

  function showStops(open) {
    panel.classList.toggle("open", open);
    openStopsButton.setAttribute("aria-expanded", String(open));
  }

  function closeMemory() {
    window.TripGallery?.closeMemory();
  }

  function getFractions() {
    return mode === "direct" ? directFractions : roadFractions;
  }

  function actualStopIndex(visibleIndex) {
    return allStops.findIndex(stop => stop.id === visibleStops[visibleIndex]?.id);
  }

  function renderStops() {
    list.replaceChildren();

    visibleStops.forEach((stop, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stop-button";
      button.classList.toggle("active", index === currentStop);
      button.setAttribute("aria-current", index === currentStop ? "step" : "false");

      const number = document.createElement("span");
      number.className = "stop-number";
      number.textContent = String(index + 1);

      const name = document.createElement("span");
      name.className = "stop-name";
      name.textContent = stop.name;

      button.append(number, name);
      button.addEventListener("click", () => {
        if (isMoving) return;
        goToStop(index, true);
        if (isMobile()) showStops(false);
      });

      item.appendChild(button);
      list.appendChild(item);
    });

    stopCount.textContent = String(visibleStops.length);
  }

  function updateList() {
    [...list.querySelectorAll(".stop-button")].forEach((button, index) => {
      button.classList.toggle("active", index === currentStop);
      button.setAttribute("aria-current", index === currentStop ? "step" : "false");
    });
  }

  function updateVehiclePosition(fraction) {
    if (!mapReady()) return;

    const point = window.TripMap.positionAtRouteFraction(fraction);
    vehicle.style.left = `${point.x}px`;
    vehicle.style.top = `${point.y}px`;
  }

  function updateProgress(fraction) {
    if (!mapReady()) return;

    window.TripMap.setProgress(fraction);
    updateVehiclePosition(fraction);
  }

  function setStatus(text) {
    status.textContent = text;
  }

  function openCurrentMemory() {
    const stop = visibleStops[currentStop];
    if (!stop) return;

    closeMemory();
    window.TripGallery?.openMemory(stop.id);
    setStatus(`Has llegado a ${stop.name}`);
  }

  function goToStop(index, showMemory) {
    if (!mapReady()) return;

    if (animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    currentStop = Math.max(0, Math.min(index, visibleStops.length - 1));
    visited = [...new Set([...visited, actualStopIndex(currentStop)])];

    updateList();
    updateProgress(getFractions()[currentStop]);

    window.TripMap.updateStopStates(actualStopIndex(currentStop), visited);

    if (showMemory) {
      openCurrentMemory();
    } else {
      setStatus(currentStop === 0 ? "Preparados para salir" : `En ${visibleStops[currentStop].name}`);
    }

    continueButton.disabled = false;
    continueButton.innerHTML = currentStop >= visibleStops.length - 1
      ? 'Finalizar <span>✓</span>'
      : 'Seguimos <span>→</span>';
  }

  // Desplazamiento suave. El avión tarda 1,5 segundos en llegar a Granada.
  function travelToStop(nextIndex) {
    if (!mapReady() || isMoving || nextIndex >= visibleStops.length) return;

    closeMemory();
    showStops(false);

    const fractions = getFractions();
    const start = fractions[currentStop];
    const end = fractions[nextIndex];

    const duration = mode === "direct"
      ? 1500
      : Math.max(3500, Math.min(9000, Math.abs(end - start) * 14500));

    const startTime = performance.now();
    isMoving = true;
    vehicle.textContent = mode === "direct" ? "✈️" : "🚙";
    setStatus(`En camino a ${visibleStops[nextIndex].name}…`);

    function frame(now) {
      const progress = Math.min(1, (now - startTime) / duration);

      // Suaviza el inicio y el final sin dar sensación de velocidad brusca.
      const eased = progress * progress * (3 - 2 * progress);
      updateProgress(start + (end - start) * eased);

      if (progress < 1) {
        animationFrame = requestAnimationFrame(frame);
        return;
      }

      animationFrame = null;
      isMoving = false;
      currentStop = nextIndex;

      visited = [...new Set([...visited, actualStopIndex(currentStop)])];
      updateList();
      window.TripMap.updateStopStates(actualStopIndex(currentStop), visited);

      openCurrentMemory();

      continueButton.disabled = false;
      continueButton.innerHTML = currentStop >= visibleStops.length - 1
        ? 'Finalizar <span>✓</span>'
        : 'Seguimos <span>→</span>';
    }

    animationFrame = requestAnimationFrame(frame);
  }

  function chooseMode(nextMode) {
    if (isMoving && animationFrame !== null) {
      cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }

    isMoving = false;
    mode = nextMode;
    currentStop = 0;
    visited = [0];

    closeMemory();
    showStops(false);

    document.querySelectorAll(".mode-button").forEach(button => {
      button.classList.toggle("active", button.dataset.mode === mode);
    });

    if (mode === "direct") {
      visibleStops = [allStops[0], allStops[5]];
      vehicle.textContent = "✈️";
      window.TripMap.drawRoute(window.TripMap.directRoute);
      window.TripMap.setVisibleStops([0, 5]);
      setStatus("Vuelo directo desde Tolosa");
    } else {
      visibleStops = allStops;
      vehicle.textContent = "🚙";
      window.TripMap.drawRoute(window.TripMap.roadRoute);
      window.TripMap.setVisibleStops([0, 1, 2, 3, 4, 5]);
      setStatus("Preparados para salir");
    }

    renderStops();
    goToStop(0, false);
  }

  document.querySelectorAll(".mode-button").forEach(button => {
    button.addEventListener("click", () => chooseMode(button.dataset.mode));
  });

  openStopsButton.addEventListener("click", () => {
    showStops(!panel.classList.contains("open"));
  });

  closeStopsButton.addEventListener("click", () => showStops(false));

  continueButton.addEventListener("click", () => {
    if (isMoving) return;

    if (currentStop >= visibleStops.length - 1) {
      closeMemory();
      setStatus("Viaje terminado. ¡Gracias por compartirlo!");
      continueButton.disabled = true;
      continueButton.innerHTML = 'Viaje terminado <span>✓</span>';
      return;
    }

    travelToStop(currentStop + 1);
  });

  document.getElementById("close-memory").addEventListener("click", closeMemory);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMemory();
      showStops(false);
    }
  });

  window.addEventListener("resize", () => {
    if (!isMoving && mapReady()) {
      updateProgress(getFractions()[currentStop]);
    }
  });

  const waitForMap = setInterval(() => {
    if (!mapReady()) return;
    clearInterval(waitForMap);
    chooseMode("real");
  }, 100);
})();
