(() => {

  "use strict";


  /* =========================================
     PARADAS
  ========================================= */

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


  /* =========================================
     ESTADO
  ========================================= */

  let currentMode = "direct";

  let currentStopIndex = -1;

  let moving = false;

  let mapReady = false;

  let pendingMode = null;


  /* =========================================
     ELEMENTOS
  ========================================= */

  const startScreen =
    document.getElementById("start-screen");

  const startTrip =
    document.getElementById("start-trip");

  const vehicle =
    document.getElementById("vehicle");

  const stopList =
    document.getElementById("stop-list");

  const stopCount =
    document.getElementById("stop-count");

  const travelStatus =
    document.getElementById("travel-status");

  const openStopsButton =
    document.getElementById("open-stops");

  const closeStopsButton =
    document.getElementById("close-stops");

  const stopsPanel =
    document.getElementById("stops-panel");

  const continueButton =
    document.getElementById("continue-trip");

  const closeMemoryButton =
    document.getElementById("close-memory");


  /* =========================================
     SELECCIÓN DEL VIAJE
  ========================================= */

  document
    .querySelectorAll(".trip-option")
    .forEach(button => {

      button.addEventListener("click", () => {

        document
          .querySelectorAll(".trip-option")
          .forEach(item => {

            item.classList.remove(
              "selected"
            );

          });


        button.classList.add(
          "selected"
        );


        currentMode =
          button.dataset.mode;

      });

    });


  /* =========================================
     PARADAS VISIBLES
  ========================================= */

  function getVisibleStops() {

    if (currentMode === "direct") {

      return [

        allStops[0],

        allStops[5]

      ];

    }


    return allStops;

  }


  /* =========================================
     FRACCIONES DEL RECORRIDO
  ========================================= */

  function getFractions() {

    if (!window.TripMap) {

      return [0, 1];

    }


    /*
      MODO DIRECTO
      Solo Tolosa → Granada.
    */

    if (currentMode === "direct") {

      return [0, 1];

    }


    /*
      MODO REAL
      Usamos las posiciones exactas
      de las paradas dentro de roadRoute.
    */

    return allStops.map(stop =>

      window.TripMap.getRoadStopFraction(
        stop.id
      )

    );

  }


  /* =========================================
     POSICIÓN DEL COCHE
  ========================================= */

  function positionVehicle(fraction) {

    if (!window.TripMap) {
      return;
    }


    const position =
      window.TripMap.positionAtRouteFraction(
        fraction
      );


    if (!position) {
      return;
    }


    vehicle.style.left =
      `${position.x}px`;

    vehicle.style.top =
      `${position.y}px`;


    /*
      El emoji del coche aparece invertido
      originalmente.

      Lo corregimos girándolo 180º
      en el eje X.

      NO rotamos según el tramo.
    */

    vehicle.style.transform =
      "translate(-50%, -65%) rotateX(180deg)";

  }


  /* =========================================
     ACTUALIZAR PROGRESO
  ========================================= */

  function updateProgress(fraction) {

    if (!window.TripMap) {
      return;
    }


    window.TripMap.setProgress(
      fraction
    );


    positionVehicle(
      fraction
    );

  }


  /* =========================================
     VIAJAR ENTRE PARADAS
  ========================================= */

  function travelToStop(
    start,
    end
  ) {

    if (moving) {
      return;
    }


    moving = true;

    continueButton.disabled = true;


    const startTime =
      performance.now();


    const distance =
      Math.abs(
        end - start
      );


    const duration =
      currentMode === "direct"

        ? 1800

        : Math.max(
            2600,
            Math.min(
              6000,
              2600 +
              distance * 5000
            )
          );


    function easeInOut(t) {

      return t < 0.5

        ? 2 * t * t

        : 1 -
          Math.pow(
            -2 * t + 2,
            2
          ) / 2;

    }


    function animate(now) {

      const elapsed =
        now - startTime;


      let t =
        elapsed / duration;


      if (t > 1) {
        t = 1;
      }


      const eased =
        easeInOut(t);


      const fraction =
        start +
        (end - start) *
        eased;


      updateProgress(
        fraction
      );


      if (t < 1) {

        requestAnimationFrame(
          animate
        );

        return;

      }


      /*
        MUY IMPORTANTE:

        Colocamos el coche EXACTAMENTE
        en la fracción final.

        De esta manera se queda junto
        al círculo de la parada.
      */

      updateProgress(end);


      moving = false;


      currentStopIndex++;


      const visible =
        getVisibleStops();


      const stop =
        visible[
          currentStopIndex
        ];


      if (stop) {

        markCurrentStop(
          stop.id
        );


        travelStatus.textContent =
          `Hemos llegado a ${stop.name}`;


        if (
          window.TripGallery
        ) {

          window.TripGallery.openMemory(
            stop.id
          );

        }

      }


      /*
        Si todavía quedan paradas,
        mostramos Seguimos.
      */

      if (
        currentStopIndex <
        visible.length - 1
      ) {

        continueButton.disabled =
          false;

      }

      else {

        continueButton.disabled =
          true;

        travelStatus.textContent =
          "Hemos llegado al final del viaje.";

      }

    }


    requestAnimationFrame(
      animate
    );

  }


  /* =========================================
     LISTA DE PARADAS
  ========================================= */

  function renderStops() {

    const visible =
      getVisibleStops();


    stopList.replaceChildren();


    stopCount.textContent =
      visible.length;


    visible.forEach(
      (stop, index) => {

        const li =
          document.createElement(
            "li"
          );


        li.className =
          "stop-item";


        li.dataset.stopId =
          stop.id;


        li.innerHTML = `

          <span class="stop-number">
            ${index + 1}
          </span>

          <span class="stop-name">
            ${stop.name}
          </span>

        `;


        stopList.appendChild(
          li
        );

      }
    );

  }


  /* =========================================
     MARCAR PARADA
  ========================================= */

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


  /* =========================================
     CAMBIAR DE MODO
  ========================================= */

  function chooseMode(mode) {

    /*
      Protección contra el error
      de TripMap undefined.
    */

    if (
      !window.TripMap
    ) {

      pendingMode = mode;

      return;

    }


    currentMode =
      mode;


    currentStopIndex =
      -1;


    moving =
      false;


    continueButton.disabled =
      false;


    const visible =
      getVisibleStops();


    renderStops();


    /*
      Ahora TripMap sí existe.
    */

    window.TripMap.setMode(
      currentMode
    );


    const fractions =
      getFractions();


    /*
      Comenzamos exactamente
      en Tolosa.
    */

    updateProgress(
      fractions[0]
    );


    markCurrentStop(
      visible[0].id
    );


    travelStatus.textContent =
      `Salimos de ${visible[0].name}`;

  }


  /* =========================================
     BOTÓN SEGUIMOS DEL VIAJE
  ========================================= */

  continueButton.addEventListener(
    "click",
    () => {

      if (moving) {
        return;
      }


      const visible =
        getVisibleStops();


      const fractions =
        getFractions();


      /*
        Primer clic:
        Tolosa → siguiente parada.
      */

      if (
        currentStopIndex < 0
      ) {

        currentStopIndex =
          0;


        if (
          visible.length > 1
        ) {

          travelToStop(

            fractions[0],

            fractions[1]

          );

        }


        return;

      }


      const nextIndex =
        currentStopIndex + 1;


      if (
        nextIndex >=
        visible.length
      ) {

        continueButton.disabled =
          true;

        return;

      }


      travelToStop(

        fractions[
          currentStopIndex
        ],

        fractions[
          nextIndex
        ]

      );

    }
  );


  /* =========================================
     PANEL DE PARADAS
  ========================================= */

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


  /* =========================================
     CERRAR RECUERDO
  ========================================= */

  closeMemoryButton.addEventListener(
    "click",
    () => {

      const panel =
        document.getElementById(
          "memory-panel"
        );


      panel.classList.remove(
        "open"
      );


      panel.setAttribute(
        "aria-hidden",
        "true"
      );

    }
  );


  /* =========================================
     MAPA LISTO
  ========================================= */

  window.addEventListener(
    "trip-map-ready",
    () => {

      mapReady =
        true;


      /*
        Preparamos el mapa,
        pero NO empezamos el viaje.
      */

      if (
        window.TripMap
      ) {

        window.TripMap.setMode(
          "direct"
        );


        updateProgress(
          0
        );

      }


      /*
        Si el usuario había pulsado
        Seguimos antes de que cargase
        el mapa, arrancamos ahora.
      */

      if (
        pendingMode
      ) {

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


  /* =========================================
     BOTÓN SEGUIMOS INICIAL
  ========================================= */

  startTrip.addEventListener(
    "click",
    () => {

      const selected =
        document.querySelector(
          ".trip-option.selected"
        );


      const mode =
        selected?.dataset.mode ||
        "direct";


      /*
        Si el mapa aún no ha terminado
        de cargar, esperamos.
      */

      if (
        !mapReady ||
        !window.TripMap
      ) {

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


})();
