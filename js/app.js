(() => {
  "use strict";

  let currentMode = "direct";
  let currentStopIndex = -1;
  let moving = false;
  let mapReady = false;
  let pendingMode = null;

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


  /* =====================================================
     ELEMENTOS
  ===================================================== */

  const startScreen =
    document.getElementById("start-screen");

  const startTripButton =
    document.getElementById("start-trip");

  const tripOptions =
    document.querySelectorAll(".trip-option");

  const stopList =
    document.getElementById("stop-list");

  const travelStatus =
    document.getElementById("travel-status");

  const stopsPanel =
    document.getElementById("stops-panel");

  const openStopsButton =
    document.getElementById("open-stops");

  const closeStopsButton =
    document.getElementById("close-stops");

  const stopCount =
    document.getElementById("stop-count");

  const memoryPanel =
    document.getElementById("memory-panel");

  const closeMemoryButton =
    document.getElementById("close-memory");

  const continueTripButton =
    document.getElementById("continue-trip");


  /* =====================================================
     PARADAS VISIBLES
  ===================================================== */

  function getVisibleStops() {

    if (currentMode === "direct") {
      return [
        allStops[0],
        allStops[5]
      ];
    }

    return allStops;
  }


  /* =====================================================
     FRACCIONES DEL RECORRIDO
  ===================================================== */

  function getFractions() {

    if (currentMode === "direct") {
      return [0, 1];
    }

    return allStops.map(stop => {

      if (
        window.TripMap &&
        typeof window.TripMap.getRoadStopFraction === "function"
      ) {
        return window.TripMap.getRoadStopFraction(
          stop.id
        );
      }

      return 0;
    });
  }


  /* =====================================================
     LISTA DE PARADAS
  ===================================================== */

  function renderStopList() {

    if (!stopList) {
      return;
    }

    stopList.replaceChildren();

    const visibleStops =
      getVisibleStops();

    stopCount.textContent =
      visibleStops.length;

    visibleStops.forEach((stop, index) => {

      const li =
        document.createElement("li");

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
    });

    updateStopList();
  }


  /* =====================================================
     ACTUALIZAR LISTA
  ===================================================== */

  function updateStopList() {

    if (!stopList) {
      return;
    }

    const items =
      stopList.querySelectorAll("li");

    const visibleStops =
      getVisibleStops();

    items.forEach((item, index) => {

      item.classList.remove(
        "active",
        "done"
      );

      if (
        currentStopIndex >= 0 &&
        index < currentStopIndex
      ) {
        item.classList.add("done");
      }

      if (
        currentStopIndex >= 0 &&
        index === currentStopIndex
      ) {
        item.classList.add("active");
      }
    });

    if (travelStatus) {

      if (moving) {

        travelStatus.textContent =
          "Estamos avanzando…";

      } else if (currentStopIndex < 0) {

        travelStatus.textContent =
          "Preparados para salir";

      } else if (
        currentStopIndex >=
        visibleStops.length - 1
      ) {

        travelStatus.textContent =
          "Hemos llegado al destino";

      } else {

        travelStatus.textContent =
          `Parada ${currentStopIndex + 1} de ${visibleStops.length}`;
      }
    }
  }


  /* =====================================================
     POSICIÓN DEL VEHÍCULO
  ===================================================== */

  function positionVehicle(fraction) {

    if (
      !window.TripMap ||
      typeof window.TripMap.positionAtRouteFraction !== "function"
    ) {
      return;
    }

    window.TripMap.positionAtRouteFraction(
      fraction
    );
  }


  /* =====================================================
     ANIMACIÓN
     
     IMPORTANTE:
     coche/avión y línea negra reciben EXACTAMENTE
     la misma fracción en cada frame.
  ===================================================== */

  function animateTrip(
    fromFraction,
    toFraction,
    duration
  ) {

    return new Promise(resolve => {

      const startTime =
        performance.now();

      function frame(now) {

        const elapsed =
          now - startTime;

        let progress =
          elapsed / duration;

        progress =
          Math.max(
            0,
            Math.min(1, progress)
          );

        const eased =
          progress < 0.5
            ? 2 * progress * progress
            : 1 -
              Math.pow(
                -2 * progress + 2,
                2
              ) / 2;

        const fraction =
          fromFraction +
          (
            toFraction -
            fromFraction
          ) * eased;

        /*
         * UNA ÚNICA LLAMADA.
         *
         * Mueve simultáneamente:
         * - coche/avión
         * - línea negra
         */
        positionVehicle(
          fraction
        );

        if (progress < 1) {

          requestAnimationFrame(
            frame
          );

        } else {

          /*
           * Forzamos el punto final exacto.
           */
          positionVehicle(
            toFraction
          );

          resolve();
        }
      }

      requestAnimationFrame(
        frame
      );
    });
  }


  /* =====================================================
     VIAJAR A LA SIGUIENTE PARADA
  ===================================================== */

  async function travelToStop(
    fromFraction,
    toFraction,
    targetIndex
  ) {

    if (moving) {
      return;
    }

    moving = true;

    updateStopList();

    /*
     * El viaje directo es más corto.
     */
    let duration;

    if (currentMode === "direct") {

      duration = 2400;

    } else {

      /*
       * Las etapas largas tardan más.
       */
      const distance =
        Math.abs(
          toFraction -
          fromFraction
        );

      duration =
        Math.max(
          2200,
          Math.min(
            6500,
            1800 +
            distance * 7000
          )
        );
    }

    await animateTrip(
      fromFraction,
      toFraction,
      duration
    );

    moving = false;

    currentStopIndex =
      targetIndex;

    updateStopList();

    /*
     * Al llegar, mostramos el recuerdo.
     */
    openMemoryForCurrentStop();
  }


  /* =====================================================
     AVANZAR
  ===================================================== */

  async function advanceTrip() {

    if (moving) {
      return;
    }

    const visibleStops =
      getVisibleStops();

    const fractions =
      getFractions();

    /*
     * Primera pulsación:
     * Tolosa → siguiente parada.
     */
    if (currentStopIndex < 0) {

      currentStopIndex = 0;

      updateStopList();

      await travelToStop(
        fractions[0],
        fractions[1],
        1
      );

      return;
    }

    /*
     * Ya estamos en una parada.
     */
    const nextIndex =
      currentStopIndex + 1;

    if (
      nextIndex >=
      visibleStops.length
    ) {

      return;
    }

    /*
     * En modo directo:
     *
     * fractions = [0, 1]
     */
    if (currentMode === "direct") {

      await travelToStop(
        fractions[currentStopIndex],
        fractions[nextIndex],
        nextIndex
      );

      return;
    }

    /*
     * Modo viaje real.
     *
     * Hay que buscar la fracción de la parada
     * real correspondiente.
     */

    const currentStop =
      visibleStops[currentStopIndex];

    const nextStop =
      visibleStops[nextIndex];

    const from =
      window.TripMap.getRoadStopFraction(
        currentStop.id
      );

    const to =
      window.TripMap.getRoadStopFraction(
        nextStop.id
      );

    await travelToStop(
      from,
      to,
      nextIndex
    );
  }


  /* =====================================================
     ABRIR RECUERDO
  ===================================================== */

  function openMemoryForCurrentStop() {

    const visibleStops =
      getVisibleStops();

    if (
      currentStopIndex < 0 ||
      currentStopIndex >=
      visibleStops.length
    ) {
      return;
    }

    const stop =
      visibleStops[currentStopIndex];

    if (
      window.TripGallery &&
      typeof window.TripGallery.openMemory === "function"
    ) {

      window.TripGallery.openMemory(
        stop.id
      );
    }
  }


  /* =====================================================
     CERRAR RECUERDOS
  ===================================================== */

  function closeMemory() {

    if (
      window.TripGallery &&
      typeof window.TripGallery.closeMemory === "function"
    ) {

      window.TripGallery.closeMemory();

      return;
    }

    if (memoryPanel) {

      memoryPanel.classList.remove(
        "open"
      );

      memoryPanel.setAttribute(
        "aria-hidden",
        "true"
      );
    }
  }


  /* =====================================================
     CAMBIAR MODO
  ===================================================== */

  function chooseMode(mode) {

    currentMode =
      mode === "real"
        ? "real"
        : "direct";

    currentStopIndex =
      -1;

    moving = false;

    renderStopList();

    if (
      window.TripMap &&
      typeof window.TripMap.setMode === "function"
    ) {

      window.TripMap.setMode(
        currentMode
      );
    }

    /*
     * Volvemos siempre al inicio.
     */
    positionVehicle(0);

    updateStopList();
  }


  /* =====================================================
     SELECCIÓN DE VIAJE
  ===================================================== */

  tripOptions.forEach(option => {

    option.addEventListener(
      "click",
      () => {

        tripOptions.forEach(
          other => {
            other.classList.remove(
              "selected"
            );
          }
        );

        option.classList.add(
          "selected"
        );

        currentMode =
          option.dataset.mode === "real"
            ? "real"
            : "direct";
      }
    );
  });


  /* =====================================================
     BOTÓN SEGUIMOS DE LA PANTALLA INICIAL
  ===================================================== */

  if (startTripButton) {

    startTripButton.addEventListener(
      "click",
      () => {

        const selected =
          document.querySelector(
            ".trip-option.selected"
          );

        const mode =
          selected &&
          selected.dataset.mode === "real"
            ? "real"
            : "direct";

        pendingMode =
          mode;

        /*
         * Si el mapa ya está preparado,
         * empezamos inmediatamente.
         */
        if (mapReady) {

          chooseMode(
            pendingMode
          );

          pendingMode =
            null;

          if (startScreen) {

            startScreen.classList.add(
              "hidden"
            );
          }

          return;
        }

        /*
         * Si el mapa todavía está cargando,
         * esperamos al evento.
         */
      }
    );
  }


  /* =====================================================
     BOTÓN AVANZAMOS
     
     Puede existir en el HTML como:
     #advance-trip
     .advance-button
     #continue-trip
  ===================================================== */

  const advanceButtons =
    document.querySelectorAll(
      "#advance-trip, .advance-button"
    );

  advanceButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          advanceTrip();
        }
      );
    }
  );


  /* =====================================================
     BOTÓN RECUERDOS
     
     Puede existir como:
     #open-memory
     .memory-button
  ===================================================== */

  const memoryButtons =
    document.querySelectorAll(
      "#open-memory, .memory-button"
    );

  memoryButtons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          openMemoryForCurrentStop();
        }
      );
    }
  );


  /* =====================================================
     BOTÓN CONTINUAR DEL RECUERDO
  ===================================================== */

  if (continueTripButton) {

    continueTripButton.addEventListener(
      "click",
      () => {

        closeMemory();

        /*
         * Esperamos un poco para que se cierre
         * visualmente el panel antes de continuar.
         */
        setTimeout(
          () => {
            advanceTrip();
          },
          180
        );
      }
    );
  }


  /* =====================================================
     CERRAR RECUERDOS
  ===================================================== */

  if (closeMemoryButton) {

    closeMemoryButton.addEventListener(
      "click",
      () => {

        closeMemory();
      }
    );
  }


  /* =====================================================
     PANEL DE PARADAS
  ===================================================== */

  if (openStopsButton) {

    openStopsButton.addEventListener(
      "click",
      () => {

        if (!stopsPanel) {
          return;
        }

        stopsPanel.classList.add(
          "open"
        );

        openStopsButton.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    );
  }


  if (closeStopsButton) {

    closeStopsButton.addEventListener(
      "click",
      () => {

        if (!stopsPanel) {
          return;
        }

        stopsPanel.classList.remove(
          "open"
        );

        if (openStopsButton) {

          openStopsButton.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    );
  }


  /* =====================================================
     ESCAPE
  ===================================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeMemory();

        if (stopsPanel) {

          stopsPanel.classList.remove(
            "open"
          );
        }

        if (openStopsButton) {

          openStopsButton.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      }
    }
  );


  /* =====================================================
     MAPA LISTO
  ===================================================== */

  document.addEventListener(
    "trip-map-ready",
    () => {

      mapReady = true;

      /*
       * Preparar el modo seleccionado.
       */
      const selected =
        document.querySelector(
          ".trip-option.selected"
        );

      if (selected) {

        currentMode =
          selected.dataset.mode === "real"
            ? "real"
            : "direct";
      }

      chooseMode(
        currentMode
      );

      /*
       * Si el usuario ya había pulsado
       * Seguimos mientras el mapa cargaba,
       * continuamos ahora.
       */
      if (pendingMode) {

        chooseMode(
          pendingMode
        );

        pendingMode =
          null;

        if (startScreen) {

          startScreen.classList.add(
            "hidden"
          );
        }
      }
    }
  );


  /* =====================================================
     INICIALIZACIÓN
  ===================================================== */

  renderStopList();

  /*
   * Si map.js ya estaba listo antes de cargar app.js.
   */
  if (
    window.TripMap &&
    window.TripMap.ready
  ) {

    mapReady = true;

    const selected =
      document.querySelector(
        ".trip-option.selected"
      );

    if (selected) {

      currentMode =
        selected.dataset.mode === "real"
          ? "real"
          : "direct";
    }

    chooseMode(
      currentMode
    );
  }

})();
