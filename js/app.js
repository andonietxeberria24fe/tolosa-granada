(() => {
  let currentStop = 0;
  let directMode = false;

  const stopList = document.getElementById("stop-list");
  const nextButton = document.getElementById("next-stop");
  const continueButton = document.getElementById("memory-continue");
  const closeButton = document.getElementById("close-memory");
  const status = document.getElementById("status");
  const car = document.getElementById("car");
  const roadModeButton = document.getElementById("road-mode");
  const directModeButton = document.getElementById("direct-mode");

  function buildStopList() {
    stopList.replaceChildren();

    TripMap.stops.forEach((stop, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "stop-item";
      button.dataset.index = index;

      const number = document.createElement("span");
      number.className = "stop-number";
      number.textContent = index + 1;

      const textWrap = document.createElement("span");
      const name = document.createElement("span");
      name.className = "stop-name";
      name.textContent = stop.name;

      const kind = document.createElement("span");
      kind.className = "stop-kind";
      kind.textContent =
        index === 0 ? "Salida" :
        index === TripMap.stops.length - 1 ? "Llegada" :
        "Parada";

      textWrap.append(name, kind);
      button.append(number, textWrap);
      button.addEventListener("click", () => goToStop(index, true));
      item.appendChild(button);
      stopList.appendChild(item);
    });
  }

  function updateStopList() {
    stopList.querySelectorAll(".stop-item").forEach((button, index) => {
      button.classList.toggle("active", index === currentStop);
      button.setAttribute("aria-current", index === currentStop ? "step" : "false");
    });
  }

  function positionCar() {
    const point = TripMap.getStopPosition(currentStop);
    if (!point) return;

    car.style.display = "block";
    car.style.left = `${point.x / 1000 * 100}%`;
    car.style.top = `${point.y / 700 * 100}%`;
  }

  function goToStop(index, openMemory) {
    currentStop = Math.max(0, Math.min(index, TripMap.stops.length - 1));

    updateStopList();
    TripMap.setCurrentStop(currentStop);
    positionCar();

    const stop = TripMap.stops[currentStop];
    status.textContent =
      currentStop === TripMap.stops.length - 1
        ? `Llegada: ${stop.name}`
        : `Parada ${currentStop + 1} de ${TripMap.stops.length}: ${stop.name}`;

    nextButton.textContent =
      currentStop === TripMap.stops.length - 1
        ? "Volver al inicio"
        : "Seguimos →";

    if (openMemory) {
      TripGallery.openMemory(currentStop);
    }
  }

  function advance() {
    if (currentStop >= TripMap.stops.length - 1) {
      goToStop(0, true);
      return;
    }

    TripGallery.closeMemory();
    goToStop(currentStop + 1, true);
  }

  function setMode(isDirect) {
    directMode = isDirect;

    roadModeButton.classList.toggle("active", !directMode);
    directModeButton.classList.toggle("active", directMode);
    TripMap.setDirectMode(directMode);

    if (directMode) {
      car.textContent = "✈️";
      status.textContent = "Vista directa: Tolosa → Granada";
      goToStop(0, false);
      currentStop = TripMap.stops.length - 1;
      positionCar();
      updateStopList();
      TripMap.setCurrentStop(currentStop);
      nextButton.textContent = "Llegar a Granada →";
    } else {
      car.textContent = "🚙";
      goToStop(0, false);
      status.textContent = "El viaje por carretera, con todas las paradas.";
      nextButton.textContent = "Seguimos →";
    }
  }

  nextButton.addEventListener("click", advance);
  continueButton.addEventListener("click", advance);
  closeButton.addEventListener("click", TripGallery.closeMemory);
  roadModeButton.addEventListener("click", () => setMode(false));
  directModeButton.addEventListener("click", () => setMode(true));

  window.TripApp = { positionCar };

  async function start() {
    try {
      await TripMap.init();
      buildStopList();
      goToStop(0, false);
      status.textContent = "Elige una parada o pulsa «Seguimos».";
    } catch (error) {
      console.error(error);
      status.textContent =
        "No se pudo cargar el mapa. Revisa que europe.geojson esté en assets/map/.";
    }
  }

  start();
})();
