(() => {
  "use strict";

  const stops = [
    {
      id: "tolosa",
      name: "Tolosa",
      lat: 43.135,
      lon: -2.078
    },
    {
      id: "aizkorri",
      name: "Aizkorri",
      lat: 42.960,
      lon: -2.330
    },
    {
      id: "obanos",
      name: "Óbanos",
      lat: 42.680,
      lon: -1.785
    },
    {
      id: "oropesa",
      name: "Oropesa",
      lat: 40.092,
      lon: 0.135
    },
    {
      id: "benidorm",
      name: "Benidorm",
      lat: 38.541,
      lon: -0.122
    },
    {
      id: "granada",
      name: "Granada",
      lat: 37.177,
      lon: -3.598
    }
  ];

  /*
   * Oropesa → Benidorm:
   *
   * Ahora seguimos bastante más la costa.
   * La ruta se mantiene ligeramente hacia tierra
   * para evitar que visualmente parezca que va por el mar,
   * pero sin volver a meterse exageradamente hacia el interior.
   */
  const roadRoute = [
    [-2.078, 43.135],
    [-2.16, 43.05],
    [-2.33, 42.96],

    [-2.15, 42.83],
    [-1.785, 42.68],

    [-1.20, 42.25],
    [-0.55, 41.65],
    [-0.10, 41.15],

    [0.10, 40.75],
    [0.135, 40.092],

    /*
     * Oropesa → Benidorm
     * siguiendo aproximadamente la costa.
     */
    [-0.02, 39.94],
    [-0.17, 39.76],
    [-0.32, 39.53],
    [-0.46, 39.28],
    [-0.53, 39.02],
    [-0.45, 38.79],
    [-0.28, 38.62],

    [-0.122, 38.541],

    [-0.55, 38.25],
    [-1.20, 37.75],
    [-2.05, 37.35],

    [-3.598, 37.177]
  ];

  /*
   * Modo directo:
   *
   * Esta opción es deliberadamente una parodia.
   * No hay paradas intermedias.
   * Es simplemente Tolosa → Granada.
   */
  const directRoute = [
    [-2.078, 43.135],
    [-3.598, 37.177]
  ];

  const mapElement =
    document.getElementById(
      "map"
    );

  let svg = null;
  let routePath = null;
  let progressPath = null;
  let projection = null;
  let stopLayer = null;

  let activeRoute =
    roadRoute;

  function project(
    lon,
    lat
  ) {
    return projection
      ? projection(
          lon,
          lat
        )
      : {
          x: 0,
          y: 0
        };
  }

  function createSvgElement(
    name,
    attrs = {}
  ) {
    const node =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        name
      );

    Object.entries(
      attrs
    ).forEach(
      ([key, value]) => {
        node.setAttribute(
          key,
          value
        );
      }
    );

    return node;
  }

  function pathFromCoordinates(
    coords
  ) {
    return coords
      .map(
        (
          point,
          index
        ) => {
          const p =
            project(
              point[0],
              point[1]
            );

          return `${
            index === 0
              ? "M"
              : "L"
          }${p.x.toFixed(
            2
          )},${p.y.toFixed(
            2
          )}`;
        }
      )
      .join(" ");
  }

  /*
   * Para el viaje real hacemos una curva suave.
   *
   * Si solo hay dos puntos, como en el avión,
   * dejamos una línea completamente directa.
   */
  function smoothPathFromCoordinates(
    coords
  ) {
    if (
      coords.length <
      2
    ) {
      return "";
    }

    if (
      coords.length ===
      2
    ) {
      return pathFromCoordinates(
        coords
      );
    }

    const points =
      coords.map(
        ([lon, lat]) =>
          project(
            lon,
            lat
          )
      );

    let d =
      `M ${points[0].x.toFixed(
        2
      )} ${points[0].y.toFixed(
        2
      )}`;

    for (
      let i = 0;
      i <
      points.length - 1;
      i += 1
    ) {
      const p0 =
        points[i - 1] ||
        points[i];

      const p1 =
        points[i];

      const p2 =
        points[i + 1];

      const p3 =
        points[i + 2] ||
        p2;

      const cp1x =
        p1.x +
        (p2.x - p0.x) /
          6;

      const cp1y =
        p1.y +
        (p2.y - p0.y) /
          6;

      const cp2x =
        p2.x -
        (p3.x - p1.x) /
          6;

      const cp2y =
        p2.y -
        (p3.y - p1.y) /
          6;

      d +=
        ` C ${cp1x.toFixed(
          2
        )} ${cp1y.toFixed(
          2
        )}, ` +
        `${cp2x.toFixed(
          2
        )} ${cp2y.toFixed(
          2
        )}, ` +
        `${p2.x.toFixed(
          2
        )} ${p2.y.toFixed(
          2
        )}`;
    }

    return d;
  }

  function renderGeometry(
    geometry,
    group
  ) {
    if (!geometry) {
      return;
    }

    const type =
      geometry.type;

    const coords =
      geometry.coordinates;

    if (
      type ===
      "Polygon"
    ) {
      coords.forEach(
        ring => {
          group.appendChild(
            createSvgElement(
              "path",
              {
                d:
                  pathFromCoordinates(
                    ring
                  ),
                class:
                  "country"
              }
            )
          );
        }
      );
    } else if (
      type ===
      "MultiPolygon"
    ) {
      coords.forEach(
        poly => {
          renderGeometry(
            {
              type:
                "Polygon",
              coordinates:
                poly
            },
            group
          );
        }
      );
    } else if (
      type ===
      "GeometryCollection"
    ) {
      geometry.geometries.forEach(
        item =>
          renderGeometry(
            item,
            group
          )
      );
    }
  }

  function renderStops() {
    stopLayer =
      createSvgElement(
        "g",
        {
          class:
            "stop-layer"
        }
      );

    stops.forEach(
      (
        stop,
        index
      ) => {
        const p =
          project(
            stop.lon,
            stop.lat
          );

        const circle =
          createSvgElement(
            "circle",
            {
              cx: p.x,
              cy: p.y,
              r: 5.5,
              class:
                "stop-dot",
              "data-stop-index":
                index
            }
          );

        stopLayer.appendChild(
          circle
        );
      }
    );

    svg.appendChild(
      stopLayer
    );
  }

  function drawRoute(
    route
  ) {
    activeRoute =
      route;

    const d =
      smoothPathFromCoordinates(
        route
      );

    routePath.setAttribute(
      "d",
      d
    );

    progressPath.setAttribute(
      "d",
      d
    );

    routePath.setAttribute(
      "pathLength",
      "1"
    );

    progressPath.setAttribute(
      "pathLength",
      "1"
    );

    progressPath.style.strokeDasharray =
      "0 1";

    progressPath.style.strokeDashoffset =
      "0";
  }

  function setProgress(
    fraction
  ) {
    if (
      !progressPath
    ) {
      return;
    }

    const safe =
      Math.max(
        0,
        Math.min(
          1,
          fraction
        )
      );

    progressPath.style.strokeDasharray =
      `${safe} 1`;

    progressPath.style.strokeDashoffset =
      "0";
  }

  function svgPointToContainer(
    point
  ) {
    const matrix =
      svg.getScreenCTM();

    if (!matrix) {
      return {
        x: 0,
        y: 0
      };
    }

    const transformed =
      new DOMPoint(
        point.x,
        point.y
      ).matrixTransform(
        matrix
      );

    const rect =
      mapElement.getBoundingClientRect();

    return {
      x:
        transformed.x -
        rect.left,

      y:
        transformed.y -
        rect.top
    };
  }

  function pointOnActiveRoute(
    fraction,
    lookAhead = 0.006
  ) {
    if (
      !routePath
    ) {
      return {
        x: 0,
        y: 0,
        angle: 0
      };
    }

    const length =
      routePath.getTotalLength();

    const safeFraction =
      Math.max(
        0,
        Math.min(
          1,
          fraction
        )
      );

    const distance =
      safeFraction *
      length;

    const p =
      routePath.getPointAtLength(
        distance
      );

    /*
     * Para calcular la orientación:
     *
     * - si no estamos al final, miramos hacia delante;
     * - si estamos al final, miramos hacia atrás.
     *
     * Así el vehículo conserva la dirección correcta
     * incluso al llegar a una parada.
     */
    const step =
      Math.max(
        4,
        length *
          lookAhead
      );

    let directionStart;
    let directionEnd;

    if (
      distance >=
      length - 1
    ) {
      directionStart =
        routePath.getPointAtLength(
          Math.max(
            0,
            distance - step
          )
        );

      directionEnd =
        p;
    } else {
      directionStart =
        p;

      directionEnd =
        routePath.getPointAtLength(
          Math.min(
            length,
            distance +
              step
          )
        );
    }

    const current =
      svgPointToContainer(
        p
      );

    const next =
      svgPointToContainer(
        directionEnd
      );

    const previous =
      svgPointToContainer(
        directionStart
      );

    const dx =
      next.x -
      previous.x;

    const dy =
      next.y -
      previous.y;

    const angle =
      Math.atan2(
        dy,
        dx
      ) *
      180 /
      Math.PI;

    return {
      x: current.x,
      y: current.y,
      angle
    };
  }

  function positionAtRouteFraction(
    fraction
  ) {
    return pointOnActiveRoute(
      fraction
    );
  }

  /*
   * Busca la posición real de cada parada
   * sobre la línea dibujada.
   *
   * Esto hace que los porcentajes no dependan
   * de números puestos manualmente.
   */
  function getStopFraction(
    stopIndex
  ) {
    if (
      !routePath
    ) {
      return 0;
    }

    const stop =
      stops[
        stopIndex
      ];

    if (!stop) {
      return 0;
    }

    const target =
      project(
        stop.lon,
        stop.lat
      );

    const total =
      routePath.getTotalLength();

    const samples =
      700;

    let bestDistance =
      Infinity;

    let bestLength =
      0;

    for (
      let i = 0;
      i <= samples;
      i += 1
    ) {
      const length =
        total *
        (i /
          samples);

      const point =
        routePath.getPointAtLength(
          length
        );

      const dx =
        point.x -
        target.x;

      const dy =
        point.y -
        target.y;

      const distance =
        dx * dx +
        dy * dy;

      if (
        distance <
        bestDistance
      ) {
        bestDistance =
          distance;

        bestLength =
          length;
      }
    }

    return total
      ? bestLength /
          total
      : 0;
  }

  function getStopFractions() {
    return stops.map(
      (
        _,
        index
      ) =>
        getStopFraction(
          index
        )
    );
  }

  function setStopsVisible(
    visible
  ) {
    if (
      !stopLayer
    ) {
      return;
    }

    stopLayer.classList.toggle(
      "hidden",
      !visible
    );
  }

  function updateStopStates(
    currentIndex,
    visited
  ) {
    if (
      !stopLayer
    ) {
      return;
    }

    stopLayer
      .querySelectorAll(
        ".stop-dot"
      )
      .forEach(
        (
          dot,
          index
        ) => {
          dot.classList.toggle(
            "current",
            index ===
              currentIndex
          );

          dot.classList.toggle(
            "visited",
            visited.includes(
              index
            )
          );
        }
      );
  }

  async function init() {
    try {
      const response =
        await fetch(
          "assets/map/europe.geojson"
        );

      if (
        !response.ok
      ) {
        throw new Error(
          `GeoJSON HTTP ${response.status}`
        );
      }

      const geojson =
        await response.json();

      svg =
        createSvgElement(
          "svg",
          {
            viewBox:
              "0 0 1000 700",

            preserveAspectRatio:
              "xMidYMid meet",

            role:
              "img",

            "aria-label":
              "Mapa del recorrido de Tolosa a Granada"
          }
        );

      mapElement.replaceChildren(
        svg
      );

      projection =
        (
          lon,
          lat
        ) => ({
          x:
            ((lon + 6.2) /
              10.2) *
            1000,

          y:
            ((44.8 - lat) /
              9.0) *
            700
        });

      const countries =
        createSvgElement(
          "g",
          {
            class:
              "countries"
          }
        );

      const features =
        geojson.type ===
        "FeatureCollection"

          ? geojson.features

          : geojson.type ===
            "Feature"

            ? [
                geojson
              ]

            : [
                {
                  type:
                    "Feature",
                  geometry:
                    geojson
                }
              ];

      features.forEach(
        feature =>
          renderGeometry(
            feature.geometry,
            countries
          )
      );

      svg.appendChild(
        countries
      );

      routePath =
        createSvgElement(
          "path",
          {
            class:
              "travel-route"
          }
        );

      progressPath =
        createSvgElement(
          "path",
          {
            class:
              "route-progress"
          }
        );

      svg.append(
        routePath,
        progressPath
      );

      renderStops();

      drawRoute(
        roadRoute
      );

      setStopsVisible(
        true
      );

      updateStopStates(
        0,
        [0]
      );

      window.TripMap = {
        stops,
        roadRoute,
        directRoute,

        drawRoute,
        setProgress,
        positionAtRouteFraction,

        getStopFraction,
        getStopFractions,

        setStopsVisible,
        updateStopStates
      };
    } catch (
      error
    ) {
      console.error(
        "Error al iniciar el mapa:",
        error
      );

      mapElement.innerHTML =
        `
          <div class="map-error">
            No se ha podido cargar el mapa.
            Comprueba que existe
            <code>
              assets/map/europe.geojson
            </code>
            y que estás abriendo la web desde
            GitHub Pages o un servidor local.
          </div>
        `;
    }
  }

  init();
})();
