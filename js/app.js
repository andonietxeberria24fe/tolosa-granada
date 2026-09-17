(() => {
  "use strict";

  const mapReady = () =>
    Boolean(
      window.TripMap
    );

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

  let mode = "real";

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

  function stopIndexInAllStops(
    stop
  ) {
    return allStops.findIndex(
      item =>
        item.id ===
        stop.id
    );
  }

  function getFractions() {
    return routeFractions;
  }

  function setModeBadge() {
    if (
      mode === "direct"
    ) {
      tripBadgeIcon.textContent =
        "✈️";

      tripBadgeText.textContent =
        "Directo a Granada";
    } else {
      tripBadgeIcon.textContent =
        "🚙";

      tripBadgeText.textContent =
        "Ruta por carretera · 6 paradas";
    }
  }

  function updateVehicle(
    point
  ) {
    if (!point) return;

    vehicle.style.left =
      `${point.x}px`;

    vehicle.style.top =
      `${point.y}px`;

    vehicle.style.setProperty(
      "--vehicle-angle",
      `${point.angle || 0}deg`
    );
  }

  function updateProgress(
    fraction
  ) {
    if (!mapReady()) {
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

  function updateStopStates() {
    if (!mapReady()) {
      return;
    }

    /*
     * En modo directo no existe ninguna parada
     * visualmente.
     */
    if (
      mode === "direct"
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
        .map(index =>
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
        if (isFinal) {
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

    if (
      Math.abs(
        end - start
      ) < 0.0001
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

    vehicle.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";

    const distance =
      Math.abs(
        end - start
      );

    const duration =
      Math.max(
        2300,
        Math.min(
          9000,
          distance * 15000
        )
      );

    const startTime =
      performance.now();

    function frame(
      now
    ) {
      const progress =
        Math.min(
          1,
          (now -
            startTime) /
            duration
        );

      updateProgress(
        start +
          (end - start) *
            progress
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

  function chooseMode(
    nextMode,
    fromUser = false
  ) {
    if (!mapReady()) {
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

    if (
      mode === "direct"
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
       * Esto elimina los puntos
       * de las paradas.
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
    } else {
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

  function startNextLeg() {
    if (isMoving) {
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

    travelToStop(
      currentStop + 1
    );
  }

  startTripButton.addEventListener(
    "click",
    startNextLeg
  );

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
              button.dataset.mode,
              true
            )
        );
      }
    );

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
          window.TripMap.getStopFractions();
      }

      updateProgress(
        routeFractions[
          currentStop
        ] ?? 0
      );
    }
  );

  const waitForMap =
    setInterval(
      () => {
        if (!mapReady()) {
          return;
        }

        clearInterval(
          waitForMap
        );

        chooseMode(
          "real",
          false
        );
      },
      100
    );
})();
