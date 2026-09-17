(() => {
  "use strict";


  /* ==========================================
     MAPA LISTO
  ========================================== */

  const mapReady = () =>
    Boolean(
      window.TripMap
    );


  /* ==========================================
     PARADAS
  ========================================== */

  const allStops = [

    {
      id: "tolosa",
      name: "Tolosa",
      road: 0,
      direct: 0
    },

    {
      id: "aizkorri",
      name: "Aizkorri",
      road: 1,
      direct: null
    },

    {
      id: "obanos",
      name: "Óbanos",
      road: 2,
      direct: null
    },

    {
      id: "oropesa",
      name: "Oropesa",
      road: 3,
      direct: null
    },

    {
      id: "benidorm",
      name: "Benidorm",
      road: 4,
      direct: null
    },

    {
      id: "granada",
      name: "Granada",
      road: 5,
      direct: 1
    }

  ];


  /* ==========================================
     ELEMENTOS
  ========================================== */

  const vehicle =
    document.getElementById(
      "vehicle"
    );


  const startTripButton =
    document.getElementById(
      "start-trip"
    );


  const startTripLabel =
    document.getElementById(
      "start-trip-label"
    );


  const startIcon =
    startTripButton.querySelector(
      ".start-icon"
    );


  const tripBadgeIcon =
    document.getElementById(
      "trip-badge-icon"
    );


  const tripBadgeText =
    document.getElementById(
      "trip-badge-text"
    );


  /* ==========================================
     ESTADO
  ========================================== */

  let mode =
    "real";


  let visibleStops =
    allStops;


  let routeFractions =
    [];


  let currentStop =
    0;


  let visited =
    [0];


  let animationFrame =
    null;


  let isMoving =
    false;


  /* ==========================================
     BOTÓN INFERIOR
  ========================================== */

  function setStartButton(
    label,
    icon = "🚙",
    continuation = false,
    visible = true
  ) {

    startTripButton.hidden =
      !visible;


    startTripLabel.textContent =
      label;


    startIcon.textContent =
      icon;


    startTripButton.classList.toggle(
      "is-continuation",
      continuation
    );

  }


  /* ==========================================
     ÍNDICE DE PARADA
  ========================================== */

  function stopIndexInAllStops(
    stop
  ) {

    return allStops.findIndex(
      item =>
        item.id ===
        stop.id
    );

  }


  /* ==========================================
     FRACCIONES
  ========================================== */

  function getFractions() {

    return routeFractions;

  }


  /* ==========================================
     BADGE
  ========================================== */

  function setModeBadge() {

    if (
      mode ===
      "direct"
    ) {

      tripBadgeIcon.textContent =
        "✈️";


      tripBadgeText.textContent =
        "Directo a Granada";

    }

    else {

      tripBadgeIcon.textContent =
        "🚙";


      tripBadgeText.textContent =
        "Ruta por carretera · 6 paradas";

    }

  }


  /* ==========================================
     ACTUALIZAR VEHÍCULO
  ========================================== */

  function updateVehicle(
    point
  ) {

    if (!point) {
      return;
    }


    vehicle.style.left =
      `${point.x}px`;


    vehicle.style.top =
      `${point.y}px`;


    /*
     * ====================================================
     * AQUÍ ESTÁ EL CAMBIO.
     *
     * NO rotamos el coche.
     *
     * Antes utilizábamos rotate(angle), y eso hacía
     * que el emoji se inclinase, se pusiera de lado
     * o pareciese volcado.
     *
     * Ahora solo comprobamos si el recorrido avanza
     * hacia la derecha o hacia la izquierda.
     *
     * Derecha:
     *     scaleX(-1)
     *
     * Izquierda:
     *     scaleX(1)
     *
     * De esta manera el coche siempre permanece recto.
     * ====================================================
     */

    if (
      mode ===
      "real"
    ) {

      const angle =
        point.angle || 0;


      const goingRight =
        Math.cos(
          angle *
          Math.PI /
          180
        ) >= 0;


      vehicle.style.setProperty(
        "--vehicle-scale-x",
        goingRight
          ? "-1"
          : "1"
      );

    }

    else {

      /*
       * En el modo avión no necesitamos invertirlo.
       */

      vehicle.style.setProperty(
        "--vehicle-scale-x",
        "1"
      );

    }

  }


  /* ==========================================
     PROGRESO
  ========================================== */

  function updateProgress(
    fraction
  ) {

    if (
      !mapReady()
    ) {

      return;

    }


    window.TripMap.setProgress(
      fraction
    );


    updateVehicle(
      window.TripMap.positionAtRouteFraction(
        fraction
      )
    );

  }


  /* ==========================================
     ESTADOS DE LAS PARADAS
  ========================================== */

  function updateStopStates() {

    if (
      !mapReady()
    ) {

      return;

    }


    /*
     * EN MODO AVIÓN:
     * ocultamos las paradas.
     */

    if (
      mode ===
      "direct"
    ) {

      window.TripMap.updateStopStates(
        -1,
        []
      );

      return;

    }


    const actualIndex =
      stopIndexInAllStops(
        visibleStops[
          currentStop
        ]
      );


    const actualVisited =
      visited

        .map(
          index =>
            stopIndexInAllStops(
              visibleStops[
                index
              ]
            )
        )

        .filter(
          index =>
            index >= 0
        );


    window.TripMap.updateStopStates(
      actualIndex,
      actualVisited
    );

  }


  /* ==========================================
     MOSTRAR LLEGADA
  ========================================== */

  function showArrival(
    stop
  ) {

    const isFinal =
      currentStop >=
      visibleStops.length - 1;


    setStartButton(

      isFinal
        ? "Viaje terminado"
        : "Seguir viaje",

      mode === "direct"
        ? "✈️"
        : "🚙",

      !isFinal,

      !isFinal

    );


    window.TripGallery.openArrival(

      stop.id,

      () => {

        if (
          isFinal
        ) {

          window.TripGallery.close();


          setStartButton(
            "Viaje terminado",
            "✨",
            false,
            false
          );


          return;

        }


        window.TripGallery.close();


        travelToStop(
          currentStop + 1
        );

      }

    );

  }


  /* ==========================================
     MOVERSE A UNA PARADA
  ========================================== */

  function travelToStop(
    nextIndex
  ) {

    if (
      !mapReady() ||
      isMoving
    ) {

      return;

    }


    if (
      nextIndex >=
      visibleStops.length
    ) {

      return;

    }


    const fractions =
      getFractions();


    const start =
      fractions[
        currentStop
      ] ?? 0;


    const end =
      fractions[
        nextIndex
      ] ?? 1;


    /* ==========================================
       SI YA ESTAMOS EN EL PUNTO
    ========================================== */

    if (
      Math.abs(
        end - start
      ) <
      0.0001
    ) {

      currentStop =
        nextIndex;


      visited = [
        ...new Set([
          ...visited,
          currentStop
        ])
      ];


      const stop =
        visibleStops[
          currentStop
        ];


      updateProgress(
        end
      );


      showArrival(
        stop
      );


      return;

    }


    /* ==========================================
       CANCELAR ANIMACIÓN PREVIA
    ========================================== */

    if (
      animationFrame
    ) {

      cancelAnimationFrame(
        animationFrame
      );

    }


    isMoving =
      true;


    setStartButton(
      "En ruta…",
      mode === "direct"
        ? "✈️"
        : "🚙",
      false,
      false
    );


    window.TripGallery.close();


    /* ==========================================
       VEHÍCULO
    ========================================== */

    vehicle.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";


    /* ==========================================
       DISTANCIA
    ========================================== */

    const distance =
      Math.abs(
        end - start
      );


    /* ==========================================
       DURACIÓN
    ========================================== */

    /*
     * El vuelo es corto.
     *
     * El viaje real mantiene tiempos mayores.
     */

    const duration =
      mode === "direct"

        ? 1800

        : Math.max(
            2200,
            Math.min(
              8200,
              distance * 14500
            )
          );


    const startTime =
      performance.now();


    /* ==========================================
       FRAME
    ========================================== */

    function frame(
      now
    ) {

      const progress =
        Math.min(
          1,

          (
            now -
            startTime
          ) /
          duration
        );


      updateProgress(

        start +
        (
          end -
          start
        ) *
        progress

      );


      if (
        progress <
        1
      ) {

        animationFrame =
          requestAnimationFrame(
            frame
          );


        return;

      }


      /* ==========================================
         FIN
      ========================================== */

      animationFrame =
        null;


      isMoving =
        false;


      currentStop =
        nextIndex;


      visited = [
        ...new Set([
          ...visited,
          currentStop
        ])
      ];


      updateStopStates();


      updateProgress(
        end
      );


      const stop =
        visibleStops[
          currentStop
        ];


      showArrival(
        stop
      );

    }


    animationFrame =
      requestAnimationFrame(
        frame
      );

  }


  /* ==========================================
     CAMBIAR DE MODO
  ========================================== */

  function chooseMode(
    nextMode
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

    }


    animationFrame =
      null;


    isMoving =
      false;


    mode =
      nextMode;


    currentStop =
      0;


    visited =
      [0];


    window.TripGallery.close();


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


    /* ==========================================
       AVIÓN
    ========================================== */

    if (
      mode ===
      "direct"
    ) {

      visibleStops = [

        allStops[0],

        allStops[5]

      ];


      vehicle.textContent =
        "✈️";


      window.TripMap.drawRoute(
        window.TripMap
          .directRoute
      );


      /*
       * OCULTAMOS TODOS LOS PUNTOS
       * DE LAS PARADAS.
       */

      window.TripMap.setStopsVisible(
        false
      );


      routeFractions =
        [0, 1];


      updateProgress(
        0
      );


      setStartButton(
        "Empezar vuelo",
        "✈️",
        false,
        true
      );

    }


    /* ==========================================
       VIAJE REAL
    ========================================== */

    else {

      visibleStops =
        allStops;


      vehicle.textContent =
        "🚙";


      window.TripMap.drawRoute(
        window.TripMap
          .roadRoute
      );


      window.TripMap.setStopsVisible(
        true
      );


      routeFractions =
        window.TripMap.getStopFractions();


      updateProgress(
        routeFractions[0] ||
        0
      );


      setStartButton(
        "Comenzar el viaje",
        "🚙",
        false,
        true
      );

    }


    setModeBadge();


    updateStopStates();

  }


  /* ==========================================
     COMENZAR / SIGUIENTE
  ========================================== */

  function startNextLeg() {

    if (
      isMoving
    ) {

      return;

    }


    if (
      currentStop >=
      visibleStops.length - 1
    ) {

      setStartButton(
        "Viaje terminado",
        "✨",
        false,
        false
      );


      return;

    }


    /*
     * ========================================
     * TOLosa TAMBIÉN ES UNA PARADA
     *
     * Al pulsar "Comenzar el viaje":
     *
     * 1. Se abre Tolosa.
     * 2. Se pueden ver sus recuerdos.
     * 3. Al pulsar "Seguimos" comienza
     *    el tramo hacia Aizkorri.
     * ========================================
     */

    if (
      mode === "real" &&
      currentStop === 0
    ) {

      window.TripGallery.openArrival(

        visibleStops[0].id,

        () => {

          window.TripGallery.close();


          travelToStop(
            1
          );

        }

      );


      return;

    }


    /*
     * En modo avión salimos directamente.
     */

    travelToStop(
      currentStop + 1
    );

  }


  /* ==========================================
     BOTÓN PRINCIPAL
  ========================================== */

  startTripButton.addEventListener(
    "click",
    startNextLeg
  );


  /* ==========================================
     CAMBIO DE MODO
  ========================================== */

  document
    .querySelectorAll(
      ".mode-button"
    )

    .forEach(
      button => {

        button.addEventListener(
          "click",
          () =>
            chooseMode(
              button.dataset.mode
            )
        );

      }
    );


  /* ==========================================
     RESIZE
  ========================================== */

  window.addEventListener(
    "resize",
    () => {

      if (
        !mapReady() ||
        isMoving
      ) {

        return;

      }


      if (
        mode === "real"
      ) {

        routeFractions =
          window.TripMap
            .getStopFractions();

      }


      updateProgress(
        routeFractions[
          currentStop
        ] ?? 0
      );

    }
  );


  /* ==========================================
     ESPERAR A QUE CARGUE EL MAPA
  ========================================== */

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
