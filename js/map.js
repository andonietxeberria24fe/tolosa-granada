(() => {

  "use strict";


  const NS =
    "http://www.w3.org/2000/svg";


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
        ((lon + 6.2) / 10.2) *
        WIDTH,

      y:
        ((44.8 - lat) / 9.0) *
        HEIGHT

    };

  }


  /* =====================================================
     RUTA REAL
  ===================================================== */

  const roadRoute = [

    /* Tolosa */

    [-2.078, 43.135],

    [-2.12, 43.08],
    [-2.20, 43.02],


    /* Aizkorri */

    [-2.330, 42.960],

    [-2.27, 42.88],
    [-2.12, 42.80],


    /* Óbanos */

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


    /* OROPESA */

    [0.135, 40.092],


    /*
     * OROPESA → BENIDORM
     *
     * AQUÍ VA POR TIERRA.
     *
     * Se aleja de la costa,
     * baja por el interior
     * y vuelve hacia Benidorm.
     */

    [0.08, 39.98],

    [-0.02, 39.86],

    [-0.14, 39.72],

    [-0.24, 39.56],

    [-0.32, 39.40],

    [-0.40, 39.22],

    [-0.47, 39.04],

    [-0.50, 38.88],

    [-0.48, 38.75],

    [-0.40, 38.65],

    [-0.30, 38.59],

    [-0.20, 38.56],


    /* BENIDORM */

    [-0.122, 38.541],


    /* BENIDORM → GRANADA */

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
     ÍNDICES DE PARADAS
  ===================================================== */

  const roadStopRouteIndexes = {

    tolosa: 0,

    aizkorri: 3,

    obanos: 6,

    oropesa: 21,

    benidorm: 33,

    granada: 45

  };


  let svg = null;

  let routePath = null;

  let progressPath = null;

  let vehicle = null;

  let vehicleText = null;


  let currentRoute =
    directRoute;


  let currentMode =
    "direct";


  /* =====================================================
     CREAR ELEMENTO SVG
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

  function routeToPath(
    route
  ) {

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

  function drawGeoJson(
    data
  ) {

    const group =
      createSvgElement(
        "g",
        {
          class: "countries"
        }
      );


    const features =
      data.type ===
      "FeatureCollection"

        ? data.features

        : [data];


    features.forEach(
      feature => {

        if (
          !feature.geometry
        ) {
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


    /*
     * Ponemos el mapa detrás
     * de la ruta.
     */

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
     PUNTOS DE PARADA
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
     CAMBIAR AVIÓN / COCHE
  ===================================================== */

  function setVehicleType(
    mode
  ) {

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
     * Mirar hacia la dirección
     * del movimiento.
     */

    const goingLeft =
      after.x < before.x;


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
     PROGRESO
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


    progressPath.style.strokeDasharray =
      `${total}`;


    progressPath.style.strokeDashoffset =
      `${total * (1 - fraction)}`;

  }


  /* =====================================================
     FRACCIÓN DE CADA PARADA
  ===================================================== */

  function getRoadStopFraction(
    id
  ) {

    const index =
      roadStopRouteIndexes[id];


    if (
      index === undefined
    ) {

      return 0;

    }


    const total =
      routePath.getTotalLength();


    /*
     * Construimos la misma parte
     * de la ruta hasta la parada.
     */

    const partialRoute =
      roadRoute.slice(
        0,
        index + 1
      );


    const partialPath =
      createSvgElement(
        "path",
        {
          d:
            routeToPath(
              partialRoute
            )
        }
      );


    const partialLength =
      partialPath.getTotalLength();


    return total === 0
      ? 0
      : partialLength / total;

  }


  /* =====================================================
     CAMBIAR MODO
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


    setVehicleType(
      currentMode
    );


    /*
     * En directo:
     * solamente Tolosa y Granada.
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
                stop.id ===
                  "tolosa" ||
                stop.id ===
                  "granada"
              );


        element.style.display =
          visible
            ? ""
            : "none";

      }
    );


    setProgress(0);

    positionVehicle(0);

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


    /*
     * FONDO
     */

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


    /*
     * GEOJSON
     */

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


    /*
     * RUTA
     */

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


    /*
     * PARADAS
     */

    drawStops();


    /*
     * VEHÍCULO
     */

    createVehicle();


    /*
     * MODO INICIAL
     */

    setMode(
      "direct"
    );


    /*
     * API
     */

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


    document.dispatchEvent(
      new CustomEvent(
        "trip-map-ready"
      )
    );

  }


  drawMap();

})();
