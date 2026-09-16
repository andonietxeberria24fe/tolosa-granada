(() => {
  "use strict";

  const allStops = [
    {
      id: "tolosa",
      name: "Tolosa",
      mapIndex: 0
    },
    {
      id: "aizkorri",
      name: "Aizkorri",
      mapIndex: 1
    },
    {
      id: "obanos",
      name: "Óbanos",
      mapIndex: 2
    },
    {
      id: "oropesa",
      name: "Oropesa",
      mapIndex: 3
    },
    {
      id: "benidorm",
      name: "Benidorm",
      mapIndex: 4
    },
    {
      id: "granada",
      name: "Granada",
      mapIndex: 5
    }
  ];

  const directFractions = [0, 1];

  const list =
    document.getElementById("stop-list");

  const panel =
    document.getElementById("stops-panel");

  const openStopsButton =
    document.getElementById("open-stops");

  const closeStopsButton =
    document.getElementById("close-stops");

  const stopCount =
    document.getElementById("stop-count");

  const vehicle =
    document.getElementById("vehicle");

  const status =
    document.getElementById("travel-status");

  const continueButton =
    document.getElementById("continue-trip");

  let mode = "real";

  let visibleStops = allStops;

  let currentStop = 0;

  let visitedMapIndexes = [0];

  let animationFrame = null;

  let isMoving = false;

  function mapReady() {
    return Boolean(window.TripMap);
  }

  function isMobile() {
    return window.matchMedia(
      "(max-width: 760px)"
    ).matches;
  }

  function showStops(open) {
    panel.classList.toggle(
      "open",
      open
    );

    openStopsButton.setAttribute(
      "aria-expanded",
      String(open)
    );
  }

  function closeMemory() {
    if (window.TripGallery) {
      window.TripGallery.closeMemory();
    }
  }

  /*
   * Aquí ya NO usamos porcentajes inventados.
   *
   * En modo real cada parada obtiene su posición
   * directamente de map.js.
   */
  function getFractions() {
    if (mode === "direct") {
      return directFractions;
    }

    return visibleStops.map(stop =>
      window.TripMap.getRoadStopFraction(
        stop.id
      )
    );
  }

  function renderStops() {
    list.replaceChildren();

    visibleStops.forEach(
      (stop, index) => {
        const item =
          document.createElement("li");

        const button =
          document.createElement("button");

        button.type = "button";

        button.className =
          "stop-button";

        button.classList.toggle(
          "active",
          index === currentStop
        );

        button.setAttribute(
          "aria-current",
          index === currentStop
            ? "step"
            : "false"
        );

        const number =
          document.createElement("span");

        number.className =
          "stop-number";

        number.textContent =
          String(index + 1);

        const name =
          document.createElement("span");

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
            if (isMoving) return;

            goToStop(
              index,
              true
            );

            if (isMobile()) {
              showStops(false);
            }
          }
        );

        item.appendChild(button);

        list.appendChild(item);
      }
    );

    stopCount.textContent =
      String(visibleStops.length);
  }

  function updateList() {
    [
      ...list.querySelectorAll(
        ".stop-button"
      )
    ].forEach(
      (button, index) => {
        button.classList.toggle(
          "active",
          index === currentStop
        );

        button.setAttribute(
          "aria-current",
          index === currentStop
            ? "step"
            : "false"
        );
      }
    );
  }

  function positionVehicle(fraction) {
    if (!mapReady()) return;

    const point =
      window.TripMap
        .positionAtRouteFraction(
          fraction
        );

    vehicle.style.left =
      `${point.x}px`;

    vehicle.style.top =
      `${point.y}px`;

    /*
     * El coche gira según el trazado.
     */
    vehicle.style.transform =
      `translate(-50%, -65%) rotate(${point.angle}deg)`;
  }

  function updateProgress(fraction) {
    if (!mapReady()) return;

    const route =
      mode === "direct"
        ? window.TripMap.directRoute
        : window.TripMap.roadRoute;

    const scaled =
      Math.max(
        0,
        Math.min(1, fraction)
      ) * (route.length - 1);

    const index =
      Math.min(
        route.length - 2,
        Math.floor(scaled)
      );

    window.TripMap.setProgress(
      index,
      scaled - index
    );

    positionVehicle(fraction);
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function openCurrentMemory() {
    const stop =
      visibleStops[currentStop];

    if (!stop) return;

    closeMemory();

    window.TripGallery.openMemory(
      stop.id
    );

    setStatus(
      `Has llegado a ${stop.name}`
    );
  }

  function goToStop(
    index,
    showMemory
  ) {
    if (!mapReady()) return;

    if (animationFrame !== null) {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = null;
    }

    currentStop =
      Math.max(
        0,
        Math.min(
          index,
          visibleStops.length - 1
        )
      );

    const mapIndex =
      visibleStops[currentStop]
        .mapIndex;

    if (
      !visitedMapIndexes.includes(
        mapIndex
      )
    ) {
      visitedMapIndexes.push(
        mapIndex
      );
    }

    updateList();

    const fractions =
      getFractions();

    /*
     * Esto coloca el coche EXACTAMENTE
     * en la parada.
     */
    updateProgress(
      fractions[currentStop]
    );

    window.TripMap.updateStopStates(
      mapIndex,
      visitedMapIndexes
    );

    if (showMemory) {
      openCurrentMemory();
    } else {
      setStatus(
        currentStop === 0
          ? "Preparados para salir"
          : `En ${visibleStops[currentStop].name}`
      );
    }
  }

  function travelToStop(nextIndex) {
    if (
      !mapReady() ||
      isMoving ||
      nextIndex >= visibleStops.length
    ) {
      return;
    }

    closeMemory();

    showStops(false);

    const fractions =
      getFractions();

    const start =
      fractions[currentStop];

    const end =
      fractions[nextIndex];

    const distance =
      Math.abs(end - start);

    const duration =
      mode === "direct"
        ? 1500
        : Math.max(
            3000,
            Math.min(
              9000,
              distance * 15000
            )
          );

    const startTime =
      performance.now();

    isMoving = true;

    continueButton.disabled =
      true;

    vehicle.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";

    setStatus(
      `En camino a ${visibleStops[nextIndex].name}…`
    );

    function frame(now) {
      const progress =
        Math.min(
          1,
          (now - startTime) /
          duration
        );

      /*
       * Movimiento suave.
       */
      const eased =
        progress * progress *
        (3 - 2 * progress);

      const position =
        start +
        (end - start) *
        eased;

      updateProgress(position);

      if (progress < 1) {
        animationFrame =
          requestAnimationFrame(frame);

        return;
      }

      /*
       * FIN DEL RECORRIDO.
       *
       * Volvemos a colocar el coche exactamente
       * sobre la coordenada de la parada.
       */
      updateProgress(end);

      animationFrame = null;

      isMoving = false;

      continueButton.disabled =
        false;

      currentStop =
        nextIndex;

      const mapIndex =
        visibleStops[currentStop]
          .mapIndex;

      if (
        !visitedMapIndexes.includes(
          mapIndex
        )
      ) {
        visitedMapIndexes.push(
          mapIndex
        );
      }

      updateList();

      window.TripMap.updateStopStates(
        mapIndex,
        visitedMapIndexes
      );

      openCurrentMemory();
    }

    animationFrame =
      requestAnimationFrame(frame);
  }

  function chooseMode(nextMode) {
    if (!mapReady()) return;

    if (animationFrame !== null) {
      cancelAnimationFrame(
        animationFrame
      );

      animationFrame = null;
    }

    isMoving = false;

    continueButton.disabled =
      false;

    mode = nextMode;

    currentStop = 0;

    visitedMapIndexes = [0];

    closeMemory();

    showStops(false);

    document
      .querySelectorAll(
        ".mode-button"
      )
      .forEach(button => {
        button.classList.toggle(
          "active",
          button.dataset.mode === mode
        );
      });

    if (mode === "direct") {
      /*
       * SOLO Tolosa y Granada.
       */
      visibleStops = [
        allStops[0],
        allStops[5]
      ];

      vehicle.textContent =
        "✈️";

      window.TripMap.drawRoute(
        window.TripMap.directRoute
      );
    } else {
      /*
       * TODAS las paradas.
       */
      visibleStops =
        allStops;

      vehicle.textContent =
        "🚙";

      window.TripMap.drawRoute(
        window.TripMap.roadRoute
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

  document
    .querySelectorAll(
      ".mode-button"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          chooseMode(
            button.dataset.mode
          );
        }
      );
    });

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
      showStops(false);
    }
  );

  continueButton.addEventListener(
    "click",
    () => {
      if (isMoving) return;

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

  document.addEventListener(
    "keydown",
    event => {
      if (event.key === "Escape") {
        closeMemory();
        showStops(false);
      }
    }
  );

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
          fractions[currentStop]
        );
      }
    }
  );

  function startWhenReady() {
    if (mapReady()) {
      chooseMode("real");
      return;
    }

    window.addEventListener(
      "trip-map-ready",
      () => {
        chooseMode("real");
      },
      { once: true }
    );
  }

  startWhenReady();
})();
