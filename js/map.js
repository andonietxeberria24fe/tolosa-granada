(() => {

  "use strict";


  /* =========================================
     PARADAS
  ========================================= */

  const stops = {

    tolosa: {
      name: "Tolosa",
      lat: 43.135,
      lon: -2.078
    },

    aizkorri: {
      name: "Aizkorri",
      lat: 42.960,
      lon: -2.330
    },

    obanos: {
      name: "Óbanos",
      lat: 42.680,
      lon: -1.785
    },

    oropesa: {
      name: "Oropesa",
      lat: 40.092,
      lon: 0.135
    },

    benidorm: {
      name: "Benidorm",
      lat: 38.541,
      lon: -0.122
    },

    granada: {
      name: "Granada",
      lat: 37.177,
      lon: -3.598
    }

  };


  /* =========================================
     RUTA TERRESTRE
  ========================================= */

  /*
    Ruta visual aproximada.

    Está trazada por el interior de la península
    para evitar que la línea atraviese el mar.

    Valencia NO es una parada.
  */

  const roadRoute = [

    [-2.078, 43.135],

    [-2.12, 43.08],
    [-2.20, 43.02],
    [-2.330, 42.960],

    [-2.27, 42.88],
    [-2.12, 42.80],
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

    [0.135, 40.092],

    [0.08, 39.88],
    [0.00, 39.68],
    [-0.08, 39.48],
    [-0.12, 39.28],

    [-0.122, 38.541],

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


  /* =========================================
     ÍNDICES EXACTOS DE LAS PARADAS
  ========================================= */

  const roadStopRouteIndexes = {

    tolosa: 0,

    aizkorri: 3,

    obanos: 6,

    oropesa: 21,

    benidorm: 26,

    granada: 38

  };


  /* =========================================
     RUTA DIRECTA
  ========================================= */

  const directRoute = [

    [-2.078, 43.135],

    [-1.30, 42.60],

    [-0.50, 41.90],

    [0.10, 41.00],

    [0.00, 40.00],

    [-0.50, 39.00],

    [-1.20, 38.30],

    [-2.00, 37.80],

    [-2.80, 37.40],

    [-3.598, 37.177]

  ];


  /* =========================================
     CONFIGURACIÓN DEL MAPA
  ========================================= */

  const WIDTH = 1000;

  const HEIGHT = 700;


  function project(
    lon,
    lat
  ) {

    const x =
      ((lon + 6.2) / 10.2) *
      WIDTH;


    const y =
      ((44.8 - lat) / 9.0) *
      HEIGHT;


    return {
      x,
      y
    };

  }


  /* =========================================
     ELEMENTOS
  ========================================= */

  const mapElement =
    document.getElementById("map");


  const vehicle =
    document.getElementById("vehicle");


  let svg = null;

  let routePath = null;

  let progressPath = null;

  let activeRoute =
    roadRoute;


  let currentMode =
    "direct";


  let ready =
    false;


  /* =========================================
     CREAR SVG
  ========================================= */

  function createSvg() {

    svg =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );


    svg.setAttribute(
      "viewBox",
      `0 0 ${WIDTH} ${HEIGHT}`
    );


    svg.setAttribute(
      "preserveAspectRatio",
      "xMidYMid meet"
    );


    svg.setAttribute(
      "class",
      "trip-map-svg"
    );


    mapElement.replaceChildren(
      svg
    );

  }


  /* =========================================
     RUTA SVG
  ========================================= */

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


          return (
            index === 0
              ? `M ${p.x} ${p.y}`
              : `L ${p.x} ${p.y}`
          );

        }
      )
      .join(" ");

  }


  /* =========================================
     DIBUJAR MAPA
  ========================================= */

  async function drawMap() {

    createSvg();


    /*
      Capa del mapa.
    */

    const mapLayer =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );


    mapLayer.setAttribute(
      "class",
      "countries"
    );


    svg.appendChild(
      mapLayer
    );


    /*
      GeoJSON.
    */

    try {

      const response =
        await fetch(
          "/tolosa-granada/assets/map/europe.geojson"
        );


      if (
        response.ok
      ) {

        const geojson =
          await response.json();


        drawGeoJson(
          geojson,
          mapLayer
        );

      }

    } catch (error) {

      console.warn(
        "No se pudo cargar el GeoJSON.",
        error
      );

    }


    /*
      Ruta.
    */

    routePath =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );


    routePath.setAttribute(
      "class",
      "travel-route"
    );


    routePath.setAttribute(
      "d",
      routeToPath(
        activeRoute
      )
    );


    svg.appendChild(
      routePath
    );


    /*
      Progreso.
    */

    progressPath =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );


    progressPath.setAttribute(
      "class",
      "travel-progress"
    );


    progressPath.setAttribute(
      "d",
      routeToPath(
        activeRoute
      )
    );


    svg.appendChild(
      progressPath
    );


    /*
      Círculos y etiquetas.
    */

    drawStops();


    ready =
      true;


    window.TripMap.ready =
      true;


    window.dispatchEvent(
      new Event(
        "trip-map-ready"
      )
    );

  }


  /* =========================================
     GEOJSON
  ========================================= */

  function drawGeoJson(
    geojson,
    layer
  ) {

    if (
      !geojson ||
      !geojson.features
    ) {
      return;
    }


    geojson.features.forEach(
      feature => {

        const geometry =
          feature.geometry;


        if (!geometry) {
          return;
        }


        if (
          geometry.type ===
          "Polygon"
        ) {

          geometry.coordinates
            .forEach(
              polygon => {

                drawPolygon(
                  polygon,
                  layer
                );

              }
            );

        }


        if (
          geometry.type ===
          "MultiPolygon"
        ) {

          geometry.coordinates
            .forEach(
              multiPolygon => {

                multiPolygon.forEach(
                  polygon => {

                    drawPolygon(
                      polygon,
                      layer
                    );

                  }
                );

              }
            );

        }

      }
    );

  }


  function drawPolygon(
    coordinates,
    layer
  ) {

    const path =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path"
      );


    const d =
      coordinates
        .map(
          (point, index) => {

            const p =
              project(
                point[0],
                point[1]
              );


            return (
              index === 0
                ? `M ${p.x} ${p.y}`
                : `L ${p.x} ${p.y}`
            );

          }
        )
        .join(" ") +
      " Z";


    path.setAttribute(
      "d",
      d
    );


    path.setAttribute(
      "class",
      "country"
    );


    layer.appendChild(
      path
    );

  }


  /* =========================================
     CÍRCULOS Y ETIQUETAS
  ========================================= */

  function drawStops() {

    const layer =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g"
      );


    layer.setAttribute(
      "class",
      "stop-layer"
    );


    svg.appendChild(
      layer
    );


    const labelOffsets = {

      tolosa: {
        x: 14,
        y: -12
      },

      aizkorri: {
        x: 14,
        y: -12
      },

      obanos: {
        x: 14,
        y: 18
      },

      oropesa: {
        x: 14,
        y: -12
      },

      benidorm: {
        x: 14,
        y: 18
      },

      granada: {
        x: 14,
        y: -12
      }

    };


    Object.entries(
      stops
    ).forEach(
      ([id, stop]) => {

        const point =
          project(
            stop.lon,
            stop.lat
          );


        /*
          CÍRCULO
        */

        const circle =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "circle"
          );


        circle.setAttribute(
          "cx",
          point.x
        );


        circle.setAttribute(
          "cy",
          point.y
        );


        circle.setAttribute(
          "r",
          "7"
        );


        circle.setAttribute(
          "class",
          "stop-dot"
        );


        circle.dataset.stopId =
          id;


        layer.appendChild(
          circle
        );


        /*
          ETIQUETA

          Siempre desplazada del círculo.
        */

        const label =
          document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
          );


        const offset =
          labelOffsets[id] || {
            x: 14,
            y: -12
          };


        label.setAttribute(
          "x",
          point.x + offset.x
        );


        label.setAttribute(
          "y",
          point.y + offset.y
        );


        label.setAttribute(
          "class",
          "stop-label"
        );


        label.setAttribute(
          "text-anchor",
          "start"
        );


        label.textContent =
          stop.name;


        layer.appendChild(
          label
        );

      }
    );

  }


  /* =========================================
     CAMBIAR MODO
  ========================================= */

  function setMode(
    mode
  ) {

    currentMode =
      mode;


    if (
      mode === "direct"
    ) {

      activeRoute =
        directRoute;

    } else {

      activeRoute =
        roadRoute;

    }


    if (
      routePath
    ) {

      routePath.setAttribute(
        "d",
        routeToPath(
          activeRoute
        )
      );

    }


    if (
      progressPath
    ) {

      progressPath.setAttribute(
        "d",
        routeToPath(
          activeRoute
        )
      );

    }


    /*
      Actualizamos visibilidad
      de los puntos.
    */

    if (svg) {

      svg
        .querySelectorAll(
          ".stop-dot, .stop-label"
        )
        .forEach(
          element => {

            const id =
              element.dataset.stopId;


            /*
              En modo directo solo
              mostramos Tolosa y Granada.
            */

            const visible =
              mode === "direct"

                ? (
                    id === "tolosa" ||
                    id === "granada"
                  )

                : true;


            element.style.display =
              visible
                ? ""
                : "none";

          }
        );

    }

  }


  /* =========================================
     FRACCIÓN DE UNA PARADA
  ========================================= */

  function getRoadStopFraction(
    stopId
  ) {

    const index =
      roadStopRouteIndexes[
        stopId
      ];


    if (
      index === undefined
    ) {

      return 0;

    }


    return (
      index /
      (roadRoute.length - 1)
    );

  }


  /* =========================================
     POSICIÓN EN LA RUTA
  ========================================= */

  function positionAtRouteFraction(
    fraction
  ) {

    if (
      !activeRoute ||
      activeRoute.length < 2
    ) {

      return null;

    }


    fraction =
      Math.max(
        0,
        Math.min(
          1,
          fraction
        )
      );


    const scaled =
      fraction *
      (activeRoute.length - 1);


    const index =
      Math.min(
        activeRoute.length - 2,
        Math.floor(
          scaled
        )
      );


    const t =
      scaled - index;


    const a =
      project(
        activeRoute[index][0],
        activeRoute[index][1]
      );


    const b =
      project(
        activeRoute[index + 1][0],
        activeRoute[index + 1][1]
      );


    return {

      x:
        a.x +
        (b.x - a.x) *
        t,

      y:
        a.y +
        (b.y - a.y) *
        t

    };

  }


  /* =========================================
     PROGRESO
  ========================================= */

  function setProgress(
    fraction
  ) {

    if (
      !progressPath
    ) {
      return;
    }


    const length =
      progressPath.getTotalLength();


    progressPath.style.strokeDasharray =
      `${length}`;


    progressPath.style.strokeDashoffset =
      `${length * (1 - fraction)}`;

  }


  /* =========================================
     API
  ========================================= */

  window.TripMap = {

    ready: false,

    setMode,

    setProgress,

    getRoadStopFraction,

    positionAtRouteFraction,

    stops,

    roadRoute,

    directRoute

  };


  /* =========================================
     ARRANCAR
  ========================================= */

  drawMap();

})();
