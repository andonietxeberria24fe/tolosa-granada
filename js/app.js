(() => {
  "use strict";


  /* =====================================================
     DATOS
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


  /* =====================================================
     ELEMENTOS
  ===================================================== */

  const list =
    document.getElementById(
      "stop-list"
    );

  const panel =
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

  const stopCount =
    document.getElementById(
      "stop-count"
    );

  const vehicle =
    document.getElementById(
      "vehicle"
    );

  const status =
    document.getElementById(
      "travel-status"
    );

  const continueButton =
    document.getElementById(
      "continue-trip"
    );


  /* =====================================================
     ESTADO
  ===================================================== */

  let mode =
    "real";

  let visibleStops =
    allStops;

  let currentStop =
    0;

  let visited =
    [];

  let animationFrame =
    null;

  let isMoving =
    false;


  /* =====================================================
     MAPA LISTO
  ===================================================== */

  function mapReady() {

    return Boolean(
      window.TripMap &&
      window.TripMap.ready
    );
  }


  /* =====================================================
     MÓVIL
  ===================================================== */

  function isMobile() {

    return window.matchMedia(
      "(max-width: 760px)"
    ).matches;
  }


  /* =====================================================
     PARADAS
  ===================================================== */

  function showStops(
    open
  ) {

    panel.classList.toggle(
      "open",
      open
    );

    openStopsButton.setAttribute(
      "aria-expanded",
      String(open)
    );
  }


  /* =====================================================
     CERRAR RECUERDO
  ===================================================== */

  function closeMemory() {

    if (
      window.TripGallery &&
      typeof
        window.TripGallery
          .closeMemory ===
          "function"
    ) {

      window.TripGallery.closeMemory();

    }
  }


  /* =====================================================
     FRACCIONES
  ===================================================== */

  function getFractions() {

    if (
      mode ===
      "direct"
    ) {

      return [
        0,
        1
      ];
    }


    return visibleStops.map(
      stop => {

        if (
          window.TripMap &&
          typeof
            window.TripMap
              .getStopFraction ===
            "function"
        ) {

          return window.TripMap
            .getStopFraction(
              stop.id
            );
        }

        return 0;
      }
    );
  }


  /* =====================================================
     LISTA DE PARADAS
  ===================================================== */

  function renderStops() {

    list.replaceChildren();


    visibleStops.forEach(
      (
        stop,
        index
      ) => {

        const item =
          document.createElement(
            "li"
          );


        const button =
          document.createElement(
            "button"
          );


        button.type =
          "button";

        button.className =
          "stop-button";


        button.classList.toggle(
          "active",
          index ===
            currentStop
        );


        button.setAttribute(
          "aria-current",
          index ===
            currentStop
            ? "step"
            : "false"
        );


        const number =
          document.createElement(
            "span"
          );


        number.className =
          "stop-number";

        number.textContent =
          String(
            index + 1
          );


        const name =
          document.createElement(
            "span"
          );


        name.className =
          "stop-name";

        name.textContent =
          stop.name;


        button.append(
          number,
          name
        );


        button.addEventListener(
          "click",
          () => {

            if (
              isMoving
            ) {
              return;
            }


            goToStop(
              index,
              true
            );


            if (
              isMobile()
            ) {

              showStops(
                false
              );
            }
          }
        );


        item.appendChild(
          button
        );


        list.appendChild(
          item
        );

      }
    );


    stopCount.textContent =
      String(
        visibleStops.length
      );
  }


  /* =====================================================
     ACTUALIZAR LISTA
  ===================================================== */

  function updateList() {

    [
      ...list.querySelectorAll(
        ".stop-button"
      )
    ].forEach(
      (
        button,
        index
      ) => {

        button.classList.toggle(
          "active",
          index ===
            currentStop
        );


        button.setAttribute(
          "aria-current",
          index ===
            currentStop
            ? "step"
            : "false"
        );

      }
    );
  }


  /* =====================================================
     ACTUALIZAR VEHÍCULO + LÍNEA
     
     MUY IMPORTANTE:
     ambos reciben EXACTAMENTE
     la misma fraction.
  ===================================================== */

  function updateProgress(
    fraction
  ) {

    if (
      !mapReady()
    ) {
      return;
    }


    const route =
      mode === "direct"

        ? window.TripMap
            .directRoute

        : window.TripMap
            .roadRoute;


    const safeFraction =
      Math.max(
        0,
        Math.min(
          1,
          fraction
        )
      );


    const scaled =
      safeFraction *
      (
        route.length - 1
      );


    const index =
      Math.min(
        route.length - 2,
        Math.floor(
          scaled
        )
      );


    const localFraction =
      scaled -
      index;


    /*
     * Primero línea.
     */

    window.TripMap.setProgress(
      index,
      localFraction
    );


    /*
     * Después vehículo.
     *
     * Misma fraction exacta.
     */

    const point =
      window.TripMap
        .positionAtRouteFraction(
          safeFraction
        );


    vehicle.style.left =
      `${point.x}px`;

    vehicle.style.top =
      `${point.y}px`;
  }


  /* =====================================================
     ESTADO
  ===================================================== */

  function setStatus(
    text
  ) {

    status.textContent =
      text;
  }


  /* =====================================================
     ABRIR RECUERDO
  ===================================================== */

  function openCurrentMemory() {

    const stop =
      visibleStops[
        currentStop
      ];


    if (!stop) {
      return;
    }


    closeMemory();


    if (
      window.TripGallery &&
      typeof
        window.TripGallery
          .openMemory ===
          "function"
    ) {

      window.TripGallery
        .openMemory(
          stop.id
        );
    }


    setStatus(
      `Has llegado a ${stop.name}`
    );
  }


  /* =====================================================
     IR A PARADA
  ===================================================== */

  function goToStop(
    index,
    showMemory
  ) {

    if (
      !mapReady()
    ) {
      return;
    }


    if (
      animationFrame
    ) {

      cancelAnimationFrame(
        animationFrame
      );

      animationFrame =
        null;
    }


    currentStop =
      Math.max(
        0,
        Math.min(
          index,
          visibleStops.length - 1
        )
      );


    visited = [
      ...new Set(
        [
          ...visited,
          currentStop
        ]
      )
    ];


    updateList();


    const fractions =
      getFractions();


    updateProgress(
      fractions[
        currentStop
      ]
    );


    const actualStopIndex =
      allStops.findIndex(
        stop =>
          stop.id ===
          visibleStops[
            currentStop
          ].id
      );


    window.TripMap
      .updateStopStates(
        actualStopIndex,
        visited
      );


    if (
      showMemory
    ) {

      openCurrentMemory();

    } else {

      setStatus(
        currentStop === 0

          ? "Preparados para salir"

          : `En ${visibleStops[currentStop].name}`
      );
    }
  }


  /* =====================================================
     VIAJE
  ===================================================== */

  function travelToStop(
    nextIndex
  ) {

    if (
      !mapReady() ||
      isMoving ||
      nextIndex >=
        visibleStops.length
    ) {

      return;
    }


    closeMemory();

    showStops(
      false
    );


    const fractions =
      getFractions();


    const start =
      fractions[
        currentStop
      ];


    const end =
      fractions[
        nextIndex
      ];


    const distance =
      Math.abs(
        end - start
      );


    /*
     * Vuelo directo:
     * rápido.
     *
     * Viaje real:
     * más lento.
     */

    const duration =
      mode === "direct"

        ? 1500

        : Math.max(
            2400,
            Math.min(
              9500,
              distance * 14500
            )
          );


    const startTime =
      performance.now();


    isMoving =
      true;


    vehicle.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";


    setStatus(
      `En camino a ${visibleStops[nextIndex].name}…`
    );


    function frame(
      now
    ) {

      const progress =
        Math.min(
          1,
          (
            now -
            startTime
          ) / duration
        );


      /*
       * Velocidad constante.
       */

      const fraction =
        start +
        (
          end -
          start
        ) * progress;


      /*
       * ESTA ES LA ÚNICA ACTUALIZACIÓN.
       *
       * Línea + vehículo
       * exactamente a la misma
       * velocidad y posición.
       */

      updateProgress(
        fraction
      );


      if (
        progress < 1
      ) {

        animationFrame =
          requestAnimationFrame(
            frame
          );

        return;
      }


      /*
       * Punto final exacto.
       */

      updateProgress(
        end
      );


      animationFrame =
        null;

      isMoving =
        false;


      currentStop =
        nextIndex;


      visited = [
        ...new Set(
          [
            ...visited,
            currentStop
          ]
        )
      ];


      updateList();


      const actualStopIndex =
        allStops.findIndex(
          stop =>
            stop.id ===
            visibleStops[
              currentStop
            ].id
        );


      window.TripMap
        .updateStopStates(
          actualStopIndex,
          visited
        );


      openCurrentMemory();
    }


    animationFrame =
      requestAnimationFrame(
        frame
      );
  }


  /* =====================================================
     CAMBIAR DE VIAJE
  ===================================================== */

  function chooseMode(
    nextMode
  ) {

    if (
      isMoving &&
      animationFrame
    ) {

      cancelAnimationFrame(
        animationFrame
      );
    }


    animationFrame =
      null;

    isMoving =
      false;


    mode =
      nextMode === "direct"
        ? "direct"
        : "real";


    currentStop =
      0;


    visited =
      [0];


    closeMemory();

    showStops(
      false
    );


    document
      .querySelectorAll(
        ".mode-button"
      )
      .forEach(
        button => {

          button.classList.toggle(
            "active",
            button.dataset.mode ===
              mode
          );
        }
      );


    if (
      mode === "direct"
    ) {

      visibleStops = [
        allStops[0],
        allStops[5]
      ];


      vehicle.textContent =
        "✈️";


      window.TripMap
        .drawRoute(
          window.TripMap
            .directRoute
        );

    } else {

      visibleStops =
        allStops;


      vehicle.textContent =
        "🚙";


      window.TripMap
        .drawRoute(
          window.TripMap
            .roadRoute
        );
    }


    renderStops();


    goToStop(
      0,
      false
    );


    setStatus(
      mode === "direct"

        ? "Salida desde Tolosa"

        : "Preparados para salir"
    );
  }


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
     PARADAS
  ===================================================== */

  openStopsButton.addEventListener(
    "click",
    () => {

      showStops(
        !panel.classList.contains(
          "open"
        )
      );
    }
  );


  closeStopsButton.addEventListener(
    "click",
    () => {

      showStops(
        false
      );
    }
  );


  /* =====================================================
     SEGUIMOS
  ===================================================== */

  continueButton.addEventListener(
    "click",
    () => {

      if (
        currentStop >=
        visibleStops.length - 1
      ) {

        closeMemory();

        setStatus(
          "Viaje terminado. ¡Gracias por compartirlo!"
        );

        return;
      }


      travelToStop(
        currentStop + 1
      );
    }
  );


  /* =====================================================
     ESC
  ===================================================== */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key ===
        "Escape"
      ) {

        closeMemory();

        showStops(
          false
        );
      }
    }
  );


  /* =====================================================
     REDIMENSIONADO
  ===================================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        !isMoving &&
        mapReady()
      ) {

        const fractions =
          getFractions();


        updateProgress(
          fractions[
            currentStop
          ]
        );
      }
    }
  );


  /* =====================================================
     ESPERAR AL MAPA
  ===================================================== */

  const waitForMap =
    setInterval(
      () => {

        if (
          !mapReady()
        ) {
          return;
        }


        clearInterval(
          waitForMap
        );


        chooseMode(
          "real"
        );

      },
      100
    );

})();
