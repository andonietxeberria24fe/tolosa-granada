(() => {
  "use strict";

  const allStops = [
    {
      id: "tolosa",
      name: "Tolosa",
      emoji: "📍"
    },
    {
      id: "aizkorri",
      name: "Aizkorri",
      emoji: "⛰️"
    },
    {
      id: "obanos",
      name: "Óbanos",
      emoji: "📍"
    },
    {
      id: "oropesa",
      name: "Oropesa",
      emoji: "🌊"
    },
    {
      id: "benidorm",
      name: "Benidorm",
      emoji: "🌴"
    },
    {
      id: "granada",
      name: "Granada",
      emoji: "🏁"
    }
  ];

  let currentMode = "direct";
  let currentStopIndex = -1;
  let moving = false;

  const startScreen = document.getElementById("start-screen");
  const startTrip = document.getElementById("start-trip");

  const vehicle = document.getElementById("vehicle");

  const stopList = document.getElementById("stop-list");
  const stopCount = document.getElementById("stop-count");
  const travelStatus = document.getElementById("travel-status");

  const openStopsButton = document.getElementById("open-stops");
  const closeStopsButton = document.getElementById("close-stops");
  const stopsPanel = document.getElementById("stops-panel");

  const continueButton =
    document.getElementById("continue-trip");

  const closeMemory =
    document.getElementById("close-memory");

  const memoryPanel =
    document.getElementById("memory-panel");


  /* -----------------------------------------
     SELECCIÓN DEL VIAJE
  ----------------------------------------- */

  document.querySelectorAll(".trip-option").forEach(button => {

    button.addEventListener("click", () => {

      document
        .querySelectorAll(".trip-option")
        .forEach(item => {
          item.classList.remove("selected");
        });

      button.classList.add("selected");

      currentMode = button.dataset.mode;

    });

  });


  /* -----------------------------------------
     INICIO DEL VIAJE
  ----------------------------------------- */

  startTrip.addEventListener("click", () => {

    startScreen.classList.add("hidden");

    chooseMode(currentMode);

  });


  /* -----------------------------------------
     FRACCIONES DE LAS PARADAS
  ----------------------------------------- */

  function getFractions() {

    if (currentMode === "direct") {
      return [0, 1];
    }

    return allStops.map(stop =>
      window.TripMap.getRoadStopFraction(stop.id)
    );

  }


  /* -----------------------------------------
     POSICIÓN DEL COCHE
  ----------------------------------------- */

  function positionVehicle(fraction) {

    const position =
      window.TripMap.positionAtRouteFraction(
        fraction
      );

    if (!position) return;

    vehicle.style.left = `${position.x}px`;
    vehicle.style.top = `${position.y}px`;

    /*
      El emoji original queda invertido.
      Lo corregimos únicamente con X 180°.
    */

    vehicle.style.transform =
      "translate(-50%, -65%) rotateX(180deg)";

  }


  /* -----------------------------------------
     ACTUALIZAR PROGRESO
  ----------------------------------------- */

  function updateProgress(fraction) {

    window.TripMap.setProgress(fraction);

    positionVehicle(fraction);

  }


  /* -----------------------------------------
     VIAJAR HASTA UNA PARADA
  ----------------------------------------- */

  function travelToStop(start, end) {

    if (moving) return;

    moving = true;

    const startTime = performance.now();

    const distance =
      Math.abs(end - start);

    const duration =
      currentMode === "direct"
        ? 1800
        : Math.max(
            2600,
            Math.min(
              6000,
              2600 + distance * 5000
            )
          );


    function easeInOut(t) {

      return t < 0.5
        ? 2 * t * t
        : 1 - Math.pow(-2 * t + 2, 2) / 2;

    }


    function animate(now) {

      const elapsed = now - startTime;

      let t = elapsed / duration;

      if (t > 1) {
        t = 1;
      }

      const eased = easeInOut(t);

      const fraction =
        start + (end - start) * eased;

      updateProgress(fraction);


      if (t < 1) {

        requestAnimationFrame(animate);

        return;

      }


      /*
        MUY IMPORTANTE:
        al terminar colocamos el coche
        exactamente en la parada.
      */

      updateProgress(end);

      moving = false;

      currentStopIndex++;

      const stop =
        getVisibleStops()[currentStopIndex];

      if (stop) {

        markCurrentStop(stop.id);

        travelStatus.textContent =
          `Hemos llegado a ${stop.name}`;

        if (window.TripGallery) {
          window.TripGallery.openMemory(stop.id);
        }

      }

    }

    requestAnimationFrame(animate);

  }


  /* -----------------------------------------
     PARADAS VISIBLES
  ----------------------------------------- */

  function getVisibleStops() {

    if (currentMode === "direct") {

      return [
        allStops[0],
        allStops[5]
      ];

    }

    return allStops;

  }


  /* -----------------------------------------
     LISTA DE PARADAS
  ----------------------------------------- */

  function renderStops() {

    const visible =
      getVisibleStops();

    stopList.replaceChildren();

    stopCount.textContent =
      visible.length;


    visible.forEach((stop, index) => {

      const li =
        document.createElement("li");

      li.className = "stop-item";

      li.dataset.stopId = stop.id;

      li.innerHTML = `
        <span class="stop-number">
          ${index + 1}
        </span>

        <span class="stop-name">
          ${stop.name}
        </span>
      `;

      stopList.appendChild(li);

    });

  }


  /* -----------------------------------------
     MARCAR PARADA ACTUAL
  ----------------------------------------- */

  function markCurrentStop(id) {

    document
      .querySelectorAll(".stop-item")
      .forEach(item => {

        item.classList.toggle(
          "current",
          item.dataset.stopId === id
        );

      });

  }


  /* -----------------------------------------
     CAMBIAR DE MODO
  ----------------------------------------- */

  function chooseMode(mode) {

    currentMode = mode;

    currentStopIndex = -1;

    moving = false;

    const visible =
      getVisibleStops();

    renderStops();


    window.TripMap.setMode(mode);

    const fractions =
      getFractions();


    /*
      Comenzamos exactamente en Tolosa.
    */

    updateProgress(fractions[0]);

    markCurrentStop(
      visible[0].id
    );


    travelStatus.textContent =
      `Salimos de ${visible[0].name}`;


    /*
      Después de seleccionar el viaje,
      aparece el mapa.

      El primer "Seguimos" se usa
      para comenzar desde Tolosa.
    */

    continueButton.disabled = false;

  }


  /* -----------------------------------------
     BOTÓN SEGUIMOS
  ----------------------------------------- */

  continueButton.addEventListener(
    "click",
    () => {

      if (moving) return;

      const visible =
        getVisibleStops();

      const fractions =
        getFractions();


      /*
        Primer clic:
        Tolosa → siguiente parada.
      */

      if (currentStopIndex < 0) {

        currentStopIndex = 0;

        travelToStop(
          fractions[0],
          fractions[1]
        );

        return;

      }


      const nextIndex =
        currentStopIndex + 1;


      if (nextIndex >= visible.length) {

        travelStatus.textContent =
          "Hemos llegado al final del viaje.";

        continueButton.disabled = true;

        return;

      }


      travelToStop(
        fractions[currentStopIndex],
        fractions[nextIndex]
      );

    }
  );


  /* -----------------------------------------
     PARADAS
  ----------------------------------------- */

  openStopsButton.addEventListener(
    "click",
    () => {

      stopsPanel.classList.add("open");

      openStopsButton.setAttribute(
        "aria-expanded",
        "true"
      );

    }
  );


  closeStopsButton.addEventListener(
    "click",
    () => {

      stopsPanel.classList.remove("open");

      openStopsButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }
  );


  /* -----------------------------------------
     CERRAR RECUERDO
  ----------------------------------------- */

  closeMemory.addEventListener(
    "click",
    () => {

      memoryPanel.classList.remove("open");

      memoryPanel.setAttribute(
        "aria-hidden",
        "true"
      );

    }
  );


  /* -----------------------------------------
     ESPERAR AL MAPA
  ----------------------------------------- */

  if (window.TripMap?.ready) {

    chooseMode("direct");

  } else {

    window.addEventListener(
      "trip-map-ready",
      () => {

        /*
          La pantalla inicial permanece
          visible hasta pulsar Seguimos.
        */

        window.TripMap.setMode("direct");

        updateProgress(0);

      },
      { once: true }
    );

  }

})();
