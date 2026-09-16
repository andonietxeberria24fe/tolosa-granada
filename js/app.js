(() => {

  "use strict";


  /* =====================================================
     PARADAS
  ===================================================== */

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


  let currentMode =
    "direct";


  /*
   * Empezamos en Tolosa.
   */

  let currentStopIndex =
    0;


  let moving =
    false;


  let mapReady =
    false;


  let pendingMode =
    null;


  /* =====================================================
     ELEMENTOS
  ===================================================== */

  const startScreen =
    document.getElementById(
      "start-screen"
    );


  const startButton =
    document.getElementById(
      "start-trip"
    );


  const continueButton =
    document.getElementById(
      "continue-trip"
    );


  const memoriesButton =
    document.getElementById(
      "open-memories"
    );


  const tripActions =
    document.getElementById(
      "trip-actions"
    );


  const stopList =
    document.getElementById(
      "stop-list"
    );


  const stopCount =
    document.getElementById(
      "stop-count"
    );


  const travelStatus =
    document.getElementById(
      "travel-status"
    );


  const stopsPanel =
    document.getElementById(
      "stops-panel"
    );


  const openStopsButton =
    document.getElementById(
      "open-stops"
    );


  const closeStopsButton =
    document.getElementById(
      "close-stops"
    );


  /* =====================================================
     PARADAS VISIBLES
  ===================================================== */

  function getVisibleStops() {

    if (
      currentMode ===
      "direct"
    ) {

      return [

        allStops[0],

        allStops[5]

      ];

    }


    return allStops;

  }


  /* =====================================================
     FRACCIONES
  ===================================================== */

  function getFractions() {

    if (
      currentMode ===
      "direct"
    ) {

      return [
        0,
        1
      ];

    }


    return allStops.map(
      stop =>
        window.TripMap
          .getRoadStopFraction(
            stop.id
          )
    );

  }


  /* =====================================================
     MOSTRAR BOTONES
  ===================================================== */

  function showTripActions() {

    tripActions.classList.remove(
      "hidden"
    );

  }


  function hideTripActions() {

    tripActions.classList.add(
      "hidden"
    );

  }


  /* =====================================================
     RENDER PARADAS
  ===================================================== */

  function renderStops() {

    const visibleStops =
      getVisibleStops();


    stopList.replaceChildren();


    visibleStops.forEach(
      (stop, index) => {

        const li =
          document.createElement(
            "li"
          );


        li.className =
          "stop-list-item";


        li.dataset.stop =
          stop.id;


        const number =
          document.createElement(
            "span"
          );


        number.className =
          "stop-number";


        number.textContent =
          index + 1;


        const name =
          document.createElement(
            "span"
          );


        name.className =
          "stop-name";


        name.textContent =
          stop.name;


        li.appendChild(
          number
        );


        li.appendChild(
          name
        );


        stopList.appendChild(
          li
        );

      }
    );


    stopCount.textContent =
      visibleStops.length;


    markCurrentStop();

  }


  /* =====================================================
     MARCAR PARADA ACTUAL
  ===================================================== */

  function markCurrentStop() {

    const visibleStops =
      getVisibleStops();


    document
      .querySelectorAll(
        ".stop-list-item"
      )
      .forEach(
        item => {

          const index =
            visibleStops.findIndex(
              stop =>
                stop.id ===
                item.dataset.stop
            );


          item.classList.toggle(
            "current",
            index ===
              currentStopIndex
          );


          item.classList.toggle(
            "completed",
            index <
              currentStopIndex
          );

        }
      );

  }


  /* =====================================================
     CAMBIAR DE VIAJE
  ===================================================== */

  function chooseMode(
    mode
  ) {

    if (
      !window.TripMap
    ) {

      pendingMode =
        mode;

      return;

    }


    currentMode =
      mode === "real"
        ? "real"
        : "direct";


    /*
     * Siempre volvemos a Tolosa
     * al cambiar de viaje.
     */

    currentStopIndex =
      0;


    moving =
      false;


    window.TripMap.setMode(
      currentMode
    );


    window.TripMap.setProgress(
      0
    );


    window.TripMap.moveVehicle(
      0
    );


    renderStops();


    travelStatus.textContent =
      currentMode === "real"

        ? "Salimos de Tolosa"

        : "Preparados para volar";


    updateContinueButton();


    showTripActions();


    /*
     * Actualizar selector
     */

    document
      .querySelectorAll(
        ".mode-button"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "selected",
            button.dataset.mode ===
              currentMode
          );

        }
      );


    /*
     * Cerrar recuerdos
     */

    if (
      window.TripGallery
    ) {

      window.TripGallery
        .closeMemory();

    }

  }


  /* =====================================================
     BOTÓN AVANZAMOS
  ===================================================== */

  function updateContinueButton() {

    const visibleStops =
      getVisibleStops();


    const isLast =
      currentStopIndex >=
      visibleStops.length - 1;


    if (isLast) {

      continueButton.disabled =
        true;


      continueButton.innerHTML =
        "Hemos llegado <span>✓</span>";

    } else {

      continueButton.disabled =
        false;


      continueButton.innerHTML =
        "<span>←</span> Avanzamos";

    }

  }


  /* =====================================================
     ANIMACIÓN
  ===================================================== */

  function travelToStop(
    fromFraction,
    toFraction
  ) {

    if (moving) {
      return;
    }


    moving =
      true;


    continueButton.disabled =
      true;


    memoriesButton.disabled =
      true;


    const duration =
      currentMode === "direct"

        ? 2200

        : 2000;


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


      const t =
        Math.min(
          elapsed /
            duration,
          1
        );


      const eased =
        ease(t);


      const fraction =
        fromFraction +
        (
          toFraction -
          fromFraction
        ) *
        eased;


      window.TripMap
        .setProgress(
          fraction
        );


      window.TripMap
        .moveVehicle(
          fraction
        );


      if (t < 1) {

        requestAnimationFrame(
          frame
        );

        return;

      }


      /*
       * LLEGAMOS A LA PARADA
       */

      moving =
        false;


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

      }


      memoriesButton.disabled =
        false;


      updateContinueButton();

    }


    requestAnimationFrame(
      frame
    );

  }


  /* =====================================================
     CLICK AVANZAMOS
  ===================================================== */

  continueButton.addEventListener(
    "click",
    () => {

      if (moving) {
        return;
      }


      const visibleStops =
        getVisibleStops();


      if (
        currentStopIndex >=
        visibleStops.length - 1
      ) {

        return;

      }


      /*
       * Cerramos recuerdos
       * por si estuvieran abiertos.
       */

      if (
        window.TripGallery
      ) {

        window.TripGallery
          .closeMemory();

      }


      const fractions =
        getFractions();


      travelToStop(

        fractions[
          currentStopIndex
        ],

        fractions[
          currentStopIndex + 1
        ]

      );

    }
  );


  /* =====================================================
     CLICK RECUERDOS
  ===================================================== */

  memoriesButton.addEventListener(
    "click",
    () => {

      if (moving) {
        return;
      }


      const visibleStops =
        getVisibleStops();


      const current =
        visibleStops[
          currentStopIndex
        ];


      if (
        !current
      ) {
        return;
      }


      /*
       * Los botones desaparecen
       * mientras vemos recuerdos.
       */

      hideTripActions();


      if (
        window.TripGallery
      ) {

        window.TripGallery
          .openMemory(
            current.id
          );

      }

    }
  );


  /* =====================================================
     SELECTOR SUPERIOR
  ===================================================== */

  document
    .querySelectorAll(
      ".mode-button"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            chooseMode(
              button.dataset.mode
            );

          }
        );

      }
    );


  /* =====================================================
     OPCIONES INICIALES
  ===================================================== */

  document
    .querySelectorAll(
      ".trip-option"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".trip-option"
              )
              .forEach(
                option =>
                  option.classList
                    .remove(
                      "selected"
                    )
              );


            button.classList.add(
              "selected"
            );

          }
        );

      }
    );


  /* =====================================================
     BOTÓN INICIAL
  ===================================================== */

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

        pendingMode =
          mode;

        return;

      }


      startScreen.classList.add(
        "hidden"
      );


      chooseMode(
        mode
      );

    }
  );


  /* =====================================================
     PARADAS
  ===================================================== */

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


  /* =====================================================
     CUANDO SE CIERRA RECUERDOS
  ===================================================== */

  document.addEventListener(
    "memory-closed",
    () => {

      showTripActions();

      updateContinueButton();

    }
  );


  /* =====================================================
     ESC
  ===================================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key !==
        "Escape"
      ) {
        return;
      }


      stopsPanel.classList.remove(
        "open"
      );


      if (
        window.TripGallery
      ) {

        window.TripGallery
          .closeMemory();

      }

    }
  );


  /* =====================================================
     MAPA LISTO
  ===================================================== */

  document.addEventListener(
    "trip-map-ready",
    () => {

      mapReady =
        true;


      window.TripMap.setMode(
        "direct"
      );


      window.TripMap.setProgress(
        0
      );


      window.TripMap.moveVehicle(
        0
      );


      renderStops();


      if (pendingMode) {

        const mode =
          pendingMode;


        pendingMode =
          null;


        startScreen.classList.add(
          "hidden"
        );


        chooseMode(
          mode
        );

      }

    },
    {
      once: true
    }
  );

})();
