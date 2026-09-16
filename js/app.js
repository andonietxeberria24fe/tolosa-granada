(() => {
  "use strict";


  const allStops = [

    {
      id: "tolosa",
      name: "Tolosa"
    },

    {
      id: "aizkorri",
      name: "Aizkorri"
    },

    {
      id: "obanos",
      name: "Óbanos"
    },

    {
      id: "oropesa",
      name: "Oropesa"
    },

    {
      id: "benidorm",
      name: "Benidorm"
    },

    {
      id: "granada",
      name: "Granada"
    }

  ];


  let currentMode = "direct";

  let currentStopIndex = 0;

  let moving = false;

  let mapReady = false;

  let pendingMode = null;


  const startScreen =
    document.getElementById("start-screen");

  const startButton =
    document.getElementById("start-trip");

  const continueButton =
    document.getElementById("continue-trip");

  const vehicle =
    document.getElementById("vehicle");


  const stopList =
    document.getElementById("stop-list");

  const stopCount =
    document.getElementById("stop-count");

  const travelStatus =
    document.getElementById("travel-status");


  const stopsPanel =
    document.getElementById("stops-panel");

  const openStopsButton =
    document.getElementById("open-stops");

  const closeStopsButton =
    document.getElementById("close-stops");


  const memoryPanel =
    document.getElementById("memory-panel");

  const closeMemoryButton =
    document.getElementById("close-memory");


  /*
   * PARADAS VISIBLES
   */

  function getVisibleStops() {

    if (currentMode === "direct") {

      return [
        allStops[0],
        allStops[allStops.length - 1]
      ];

    }

    return allStops;

  }


  /*
   * FRACCIONES
   */

  function getFractions() {

    if (currentMode === "direct") {

      return [0, 1];

    }


    return allStops.map(
      stop =>
        window.TripMap
          .getRoadStopFraction(stop.id)
    );

  }


  /*
   * DIBUJAR LISTA
   */

  function renderStops() {

    const visibleStops =
      getVisibleStops();


    stopList.replaceChildren();


    visibleStops.forEach(
      (stop, index) => {

        const li =
          document.createElement("li");

        li.className = "stop-list-item";

        li.dataset.stop =
          stop.id;


        const number =
          document.createElement("span");

        number.className =
          "stop-number";

        number.textContent =
          index + 1;


        const name =
          document.createElement("span");

        name.className =
          "stop-name";

        name.textContent =
          stop.name;


        li.appendChild(number);
        li.appendChild(name);

        stopList.appendChild(li);

      }
    );


    stopCount.textContent =
      visibleStops.length;


    markCurrentStop();

  }


  /*
   * MARCAR PARADA ACTUAL
   */

  function markCurrentStop() {

    const visibleStops =
      getVisibleStops();


    document
      .querySelectorAll(".stop-list-item")
      .forEach(item => {

        const index =
          visibleStops.findIndex(
            stop =>
              stop.id === item.dataset.stop
          );


        item.classList.toggle(
          "current",
          index === currentStopIndex
        );

        item.classList.toggle(
          "completed",
          index < currentStopIndex
        );

      });

  }


  /*
   * ELEGIR MODO
   */

  function chooseMode(mode) {

    if (!window.TripMap) {

      pendingMode = mode;

      return;

    }


    currentMode =
      mode === "real"
        ? "real"
        : "direct";


    currentStopIndex = 0;

    window.TripMap.setMode(
      currentMode
    );


    renderStops();


    window.TripMap.setProgress(0);

    window.TripMap.moveVehicle(0);


    /*
     * MOSTRAR MAPA
     */

    startScreen.classList.add("hidden");

    continueButton.classList.add("visible");


    /*
     * TEXTO
     */

    travelStatus.textContent =
      currentMode === "real"
        ? "Salimos de Tolosa"
        : "Volamos de Tolosa a Granada";


    /*
     * COCHE / AVIÓN
     *
     * El vehículo real está dentro del SVG,
     * así que no hay problemas de escala.
     */

    if (vehicle) {

      vehicle.style.display =
        "block";

    }

  }


  /*
   * ANIMAR VIAJE
   */

  function travelToStop(
    fromFraction,
    toFraction
  ) {

    if (moving) return;


    moving = true;

    continueButton.disabled =
      true;


    const duration =
      currentMode === "direct"
        ? 2200
        : 1800;


    const start =
      performance.now();


    function ease(t) {

      return (
        t < 0.5
          ? 4 * t * t * t
          : 1 -
            Math.pow(
              -2 * t + 2,
              3
            ) / 2
      );

    }


    function frame(now) {

      const elapsed =
        now - start;


      let t =
        Math.min(
          elapsed / duration,
          1
        );


      const eased =
        ease(t);


      const fraction =
        fromFraction +
        (
          toFraction -
          fromFraction
        ) * eased;


      window.TripMap.setProgress(
        fraction
      );


      window.TripMap.moveVehicle(
        fraction
      );


      if (t < 1) {

        requestAnimationFrame(frame);

        return;

      }


      /*
       * LLEGAMOS
       */

      moving = false;


      currentStopIndex++;


      markCurrentStop();


      const visibleStops =
        getVisibleStops();


      const arrived =
        visibleStops[
          currentStopIndex
        ];


      if (arrived) {

        travelStatus.textContent =
          `Hemos llegado a ${arrived.name}`;


        if (
          window.TripGallery &&
          window.TripGallery.openMemory
        ) {

          window.TripGallery.openMemory(
            arrived.id
          );

        }

      }


      /*
       * ¿QUEDA OTRA PARADA?
       */

      if (
        currentStopIndex <
        visibleStops.length - 1
      ) {

        continueButton.disabled =
          false;

        continueButton.innerHTML =
          `Avanzamos <span>→</span>`;

      } else {

        /*
         * FINAL
         */

        continueButton.disabled =
          true;

        continueButton.innerHTML =
          `Hemos llegado <span>✓</span>`;

        travelStatus.textContent =
          "Hemos llegado a Granada";

      }

    }


    requestAnimationFrame(frame);

  }


  /*
   * BOTÓN AVANZAMOS
   */

  continueButton.addEventListener(
    "click",
    () => {

      if (moving) return;


      const visibleStops =
        getVisibleStops();


      /*
       * Si estamos en la última,
       * no hacemos nada.
       */

      if (
        currentStopIndex >=
        visibleStops.length - 1
      ) {

        return;

      }


      /*
       * Cerrar recuerdo anterior
       */

      if (
        window.TripGallery &&
        window.TripGallery.closeMemory
      ) {

        window.TripGallery.closeMemory();

      }


      const fractions =
        getFractions();


      const from =
        fractions[currentStopIndex];


      const to =
        fractions[currentStopIndex + 1];


      travelToStop(
        from,
        to
      );

    }
  );


  /*
   * OPCIONES INICIALES
   */

  document
    .querySelectorAll(".trip-option")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".trip-option")
            .forEach(
              option =>
                option.classList.remove(
                  "selected"
                )
            );


          button.classList.add(
            "selected"
          );

        }
      );

    });


  /*
   * BOTÓN SEGUIMOS INICIAL
   */

  startButton.addEventListener(
    "click",
    () => {

      const selected =
        document.querySelector(
          ".trip-option.selected"
        );


      const mode =
        selected?.dataset.mode ||
        "direct";


      if (!mapReady) {

        pendingMode = mode;

        return;

      }


      chooseMode(mode);

    }
  );


  /*
   * PARADAS
   */

  openStopsButton.addEventListener(
    "click",
    () => {

      stopsPanel.classList.add(
        "open"
      );

      openStopsButton.setAttribute(
        "aria-expanded",
        "true"
      );

    }
  );


  closeStopsButton.addEventListener(
    "click",
    () => {

      stopsPanel.classList.remove(
        "open"
      );

      openStopsButton.setAttribute(
        "aria-expanded",
        "false"
      );

    }
  );


  /*
   * CERRAR RECUERDO
   */

  closeMemoryButton.addEventListener(
    "click",
    () => {

      if (
        window.TripGallery &&
        window.TripGallery.closeMemory
      ) {

        window.TripGallery.closeMemory();

      }

    }
  );


  /*
   * ESC
   */

  document.addEventListener(
    "keydown",
    event => {

      if (event.key !== "Escape") {
        return;
      }


      stopsPanel.classList.remove(
        "open"
      );


      if (
        window.TripGallery &&
        window.TripGallery.closeMemory
      ) {

        window.TripGallery.closeMemory();

      }

    }
  );


  /*
   * MAPA LISTO
   */

  document.addEventListener(
    "trip-map-ready",
    () => {

      mapReady = true;


      /*
       * Al cargar, dejamos el mapa
       * preparado en Tolosa.
       */

      window.TripMap.setMode(
        "direct"
      );

      window.TripMap.setProgress(0);

      window.TripMap.moveVehicle(0);


      if (pendingMode) {

        const mode =
          pendingMode;

        pendingMode = null;

        chooseMode(mode);

      }

    },
    { once: true }
  );


  /*
   * ESTADO INICIAL
   */

  continueButton.classList.remove(
    "visible"
  );

})();
