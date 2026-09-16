(() => {

  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  const WIDTH = 1000;
  const HEIGHT = 700;


  /* =====================================================
     PARADAS
  ===================================================== */

  const stops = [

    {
      id: "tolosa",
      name: "Tolosa",
      lon: -2.078,
      lat: 43.135
    },

    {
      id: "aizkorri",
      name: "Aizkorri",
      lon: -2.330,
      lat: 42.960
    },

    {
      id: "obanos",
      name: "Óbanos",
      lon: -1.785,
      lat: 42.680
    },

    {
      id: "oropesa",
      name: "Oropesa",
      lon: 0.135,
      lat: 40.092
    },

    {
      id: "benidorm",
      name: "Benidorm",
      lon: -0.122,
      lat: 38.541
    },

    {
      id: "granada",
      name: "Granada",
      lon: -3.598,
      lat: 37.177
    }

  ];


  /* =====================================================
     PROYECCIÓN
  ===================================================== */

  function project(lon, lat) {

    return {

      x:
        ((lon + 6.2) / 10.2) * WIDTH,

      y:
        ((44.8 - lat) / 9.0) * HEIGHT

    };

  }


  /* =====================================================
     RUTA REAL
  ===================================================== */

  const roadRoute = [

    /* TOLOSA */

    [-2.078, 43.135],

    [-2.12, 43.08],
    [-2.20, 43.02],


    /* AIZKORRI */

    [-2.330, 42.960],

    [-2.27, 42.88],
    [-2.12, 42.80],


    /* ÓBANOS */

    [-1.785, 42.680],

    [-1.60, 42.58],
    [-1.40, 42.45],
    [-1.22, 42.30],
    [-1.05, 42.12],
    [-0.88, 41.95],
    [-0.70, 41.78],
    [-0.55, 41.60],
    [-0.40, 41.43],
    [-0.28, 41.25],
    [-0.15, 41.08],
    [-0.02, 40.90],
    [0.05, 40.72],
    [0.10, 40.54],


    /* =================================================
       OROPESA
    ================================================= */

    [0.135, 40.092],


    /* =================================================
       OROPESA → BENIDORM
       MÁS HACIA EL INTERIOR
    ================================================= */

    [0.02, 39.98],

    [-0.12, 39.86],

    [-0.28, 39.72],

    [-0.43, 39.56],

    [-0.56, 39.38],

    [-0.66, 39.20],

    [-0.70, 39.02],

    [-0.67, 38.86],

    [-0.59, 38.73],

    [-0.47, 38.64],

    [-0.32, 38.58],

    [-0.20, 38.55],


    /* BENIDORM */

    [-0.122, 38.541],


    /* =================================================
       BENIDORM → GRANADA
    ================================================= */

    [-0.28, 38.43],

    [-0.48, 38.32],

    [-0.72, 38.18],

    [-1.00, 38.03],

    [-1.30, 37.86],

    [-1.62, 37.70],

    [-1.95, 37.56],

    [-2.28, 37.43],

    [-2.62, 37.32],

    [-2.95, 37.25],

    [-3.25, 37.20],

    [-3.598, 37.177]

  ];


  /* =====================================================
     RUTA DIRECTA
  ===================================================== */

  const directRoute = [

    [-2.078, 43.135],

    [-3.598, 37.177]

  ];


  /* =====================================================
     ÍNDICES DE LAS PARADAS
  ===================================================== */

  const roadStopRouteIndexes = {

    tolosa: 0,

    aizkorri: 3,

    obanos: 6,

    oropesa: 20,

    benidorm: 33,

    granada: 45

  };


  let svg = null;

  let routePath = null;

  let progressPath = null;

  let vehicle = null;

  let vehicleText = null;

  let currentRoute = directRoute;

  let currentMode = "direct";


  /* =====================================================
     CREAR SVG
  ===================================================== */

  function createSvgElement(
    tag,
    attributes = {}
  ) {

    const element =
      document.createElementNS(
        NS,
        tag
      );


    Object.entries(
      attributes
    ).forEach(
      ([key, value]) => {

        element.setAttribute(
          key,
          value
        );

      }
    );


    return element;

  }


  /* =====================================================
     RUTA → PATH
  ===================================================== */

  function routeToPath(route) {

    return route
      .map(
        (point, index) => {

          const p =
            project(
              point[0],
              point[1]
            );


          return `${
            index === 0
              ? "M"
              : "L"
          } ${p.x} ${p.y}`;

        }
      )
      .join(" ");

  }


  /* =====================================================
     GEOJSON
  ===================================================== */

  function drawGeoJson(data) {

    const group =
      createSvgElement(
        "g",
        {
          class: "countries"
        }
      );


    const features =
      data.type === "FeatureCollection"

        ? data.features

        : [data];


    features.forEach(
      feature => {

        if (!feature.geometry) {
          return;
        }


        const geometry =
          feature.geometry;


        if (
          geometry.type ===
          "Polygon"
        ) {

          drawPolygon(
            geometry.coordinates,
            group
          );

        }


        if (
          geometry.type ===
          "MultiPolygon"
        ) {

          geometry.coordinates
            .forEach(
              polygon => {

                drawPolygon(
                  polygon,
                  group
                );

              }
            );

        }

      }
    );


    svg.insertBefore(
      group,
      svg.children[1]
    );

  }


  function drawPolygon(
    polygon,
    parent
  ) {

    const path =
      createSvgElement(
        "path",
        {
          class: "country"
        }
      );


    let d = "";


    polygon.forEach(
      ring => {

        ring.forEach(
          (coordinate, index) => {

            const p =
              project(
                coordinate[0],
                coordinate[1]
              );


            d +=
              `${
                index === 0
                  ? "M"
                  : "L"
              } ${p.x} ${p.y} `;

          }
        );


        d += "Z ";

      }
    );


    path.setAttribute(
      "d",
      d
    );


    parent.appendChild(
      path
    );

  }


  /* =====================================================
     PUNTOS
  ===================================================== */

  function drawStops() {

    const group =
      createSvgElement(
        "g",
        {
          class: "stops"
        }
      );


    stops.forEach(
      stop => {

        const p =
          project(
            stop.lon,
            stop.lat
          );


        const stopGroup =
          createSvgElement(
            "g",
            {
              class:
                `stop stop-${stop.id}`,

              "data-stop":
                stop.id
            }
          );


        const circle =
          createSvgElement(
            "circle",
            {
              cx: p.x,
              cy: p.y,
              r: 8,
              class: "stop-dot"
            }
          );


        stopGroup.appendChild(
          circle
        );


        group.appendChild(
          stopGroup
        );

      }
    );


    svg.appendChild(
      group
    );

  }


  /* =====================================================
     VEHÍCULO
  ===================================================== */

  function createVehicle() {

    vehicle =
      createSvgElement(
        "g",
        {
          id: "vehicle"
        }
      );


    vehicleText =
      createSvgElement(
        "text",
        {
          x: 0,
          y: 0,
          class: "vehicle-emoji",
          "text-anchor": "middle",
          "dominant-baseline": "middle"
        }
      );


    vehicleText.textContent =
      "✈️";


    vehicle.appendChild(
      vehicleText
    );


    svg.appendChild(
      vehicle
    );

  }


  /* =====================================================
     TIPO DE VEHÍCULO
  ===================================================== */

  function setVehicleType(mode) {

    if (!vehicleText) {
      return;
    }


    vehicleText.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";

  }


  /* =====================================================
     POSICIÓN DEL VEHÍCULO
  ===================================================== */

  function positionVehicle(
    fraction
  ) {

    if (
      !vehicle ||
      !routePath
    ) {

      return;

    }


    const total =
      routePath.getTotalLength();


    const distance =
      Math.max(
        0,
        Math.min(
          total,
          total * fraction
        )
      );


    const point =
      routePath.getPointAtLength(
        distance
      );


    const sample =
      Math.max(
        3,
        Math.min(
          12,
          total * 0.01
        )
      );


    const before =
      routePath.getPointAtLength(
        Math.max(
          0,
          distance - sample
        )
      );


    const after =
      routePath.getPointAtLength(
        Math.min(
          total,
          distance + sample
        )
      );


    /*
     * Dirección horizontal.
     */

    const goingLeft =
      after.x < before.x;


    /*
     * INVERSIÓN EN EJE X
     *
     * El emoji estaba mirando
     * al lado contrario.
     */

    const scaleX =
      goingLeft
        ? -1
        : 1;


    vehicle.setAttribute(
      "transform",
      `translate(${point.x} ${point.y}) scale(${scaleX} 1)`
    );


    return {
      x: point.x,
      y: point.y
    };

  }


  /* =====================================================
     PROGRESO DE LA LÍNEA
  ===================================================== */

  function setProgress(
    fraction
  ) {

    if (
      !routePath ||
      !progressPath
    ) {

      return;

    }


    const total =
      routePath.getTotalLength();


    fraction =
      Math.max(
        0,
        Math.min(
          1,
          Number(fraction) || 0
        )
      );


    progressPath.style.strokeDasharray =
      `${total}`;


    /*
     * 0 = absolutamente nada
     */

    if (fraction <= 0) {

      progressPath.style.strokeDashoffset =
        `${total}`;

      return;

    }


    /*
     * 1 = línea completa,
     * exactamente hasta el final.
     */

    if (fraction >= 1) {

      progressPath.style.strokeDashoffset =
        "0";

      return;

    }


    progressPath.style.strokeDashoffset =
      `${total * (1 - fraction)}`;

  }


  /* =====================================================
     LONGITUD DE RUTA HASTA UNA PARADA
  ===================================================== */

  function getRoadStopFraction(
    id
  ) {

    const index =
      roadStopRouteIndexes[id];


    if (index === undefined) {
      return 0;
    }


    /*
     * Tolosa
     */

    if (index === 0) {
      return 0;
    }


    /*
     * Granada
     */

    if (
      index >=
      roadRoute.length - 1
    ) {

      return 1;

    }


    let totalLength = 0;

    let stopLength = 0;


    for (
      let i = 1;
      i < roadRoute.length;
      i++
    ) {

      const a =
        project(
          roadRoute[i - 1][0],
          roadRoute[i - 1][1]
        );


      const b =
        project(
          roadRoute[i][0],
          roadRoute[i][1]
        );


      const segmentLength =
        Math.hypot(
          b.x - a.x,
          b.y - a.y
        );


      totalLength +=
        segmentLength;


      if (i <= index) {

        stopLength +=
          segmentLength;

      }

    }


    if (totalLength === 0) {
      return 0;
    }


    return (
      stopLength /
      totalLength
    );

  }


  /* =====================================================
     CAMBIAR DE MODO
  ===================================================== */

  function setMode(
    mode
  ) {

    currentMode =
      mode === "real"
        ? "real"
        : "direct";


    currentRoute =
      currentMode === "real"
        ? roadRoute
        : directRoute;


    /*
     * Primero cambiamos completamente
     * el path.
     */

    routePath.setAttribute(
      "d",
      routeToPath(
        currentRoute
      )
    );


    progressPath.setAttribute(
      "d",
      routeToPath(
        currentRoute
      )
    );


    /*
     * IMPORTANTE:
     * reiniciar ANTES de mover el vehículo.
     */

    progressPath.style.strokeDasharray =
      "";

    progressPath.style.strokeDashoffset =
      "";


    setProgress(0);


    positionVehicle(0);


    setVehicleType(
      currentMode
    );


    /*
     * Mostrar solamente las paradas
     * correspondientes al modo.
     */

    stops.forEach(
      stop => {

        const element =
          svg.querySelector(
            `.stop-${stop.id}`
          );


        if (!element) {
          return;
        }


        const visible =
          currentMode === "real"

            ? true

            : (
                stop.id === "tolosa" ||
                stop.id === "granada"
              );


        element.style.display =
          visible
            ? ""
            : "none";

      }
    );


    /*
     * Una segunda inicialización
     * garantiza que el navegador
     * no conserve el trazado anterior.
     */

    requestAnimationFrame(
      () => {

        setProgress(0);

        positionVehicle(0);

      }
    );

  }


  /* =====================================================
     DIBUJAR MAPA
  ===================================================== */

  async function drawMap() {

    const map =
      document.getElementById(
        "map"
      );


    svg =
      createSvgElement(
        "svg",
        {
          viewBox:
            `0 0 ${WIDTH} ${HEIGHT}`,

          preserveAspectRatio:
            "xMidYMid meet",

          "aria-hidden":
            "true"
        }
      );


    map.replaceChildren(
      svg
    );


    /* =================================================
       FONDO
    ================================================= */

    const background =
      createSvgElement(
        "rect",
        {
          x: 0,
          y: 0,
          width: WIDTH,
          height: HEIGHT,
          class:
            "map-background"
        }
      );


    svg.appendChild(
      background
    );


    /* =================================================
       GEOJSON
    ================================================= */

    try {

      const response =
        await fetch(
          "/tolosa-granada/assets/map/europe.geojson"
        );


      if (response.ok) {

        const geojson =
          await response.json();


        drawGeoJson(
          geojson
        );

      }

    } catch (error) {

      console.warn(
        "No se pudo cargar europe.geojson",
        error
      );

    }


    /* =================================================
       RUTAS
    ================================================= */

    const routeGroup =
      createSvgElement(
        "g",
        {
          class: "routes"
        }
      );


    routePath =
      createSvgElement(
        "path",
        {
          class:
            "travel-route",

          fill:
            "none"
        }
      );


    progressPath =
      createSvgElement(
        "path",
        {
          class:
            "travel-progress",

          fill:
            "none"
        }
      );


    routeGroup.appendChild(
      routePath
    );


    routeGroup.appendChild(
      progressPath
    );


    svg.appendChild(
      routeGroup
    );


    /* =================================================
       PARADAS
    ================================================= */

    drawStops();


    /* =================================================
       VEHÍCULO
    ================================================= */

    createVehicle();


    /* =================================================
       MODO INICIAL
    ================================================= */

    setMode(
      "direct"
    );


    /* =================================================
       API GLOBAL
    ================================================= */

    window.TripMap = {

      ready: true,

      stops,

      roadRoute,

      directRoute,

      setMode,

      setProgress,

      positionAtRouteFraction:
        positionVehicle,

      moveVehicle:
        positionVehicle,

      getRoadStopFraction

    };


    /* =================================================
       AVISAR A APP.JS
    ================================================= */

    document.dispatchEvent(
      new CustomEvent(
        "trip-map-ready"
      )
    );

  }


  /* =====================================================
     INICIAR
  ===================================================== */

  drawMap();

})();
