(() => {
  "use strict";

  const stops = [
    { id: "tolosa",   name: "Tolosa",   lat: 43.135, lon: -2.078 },
    { id: "aizkorri", name: "Aizkorri", lat: 42.960, lon: -2.330 },
    { id: "obanos",   name: "Óbanos",   lat: 42.680, lon: -1.785 },
    { id: "oropesa",  name: "Oropesa",  lat: 40.092, lon: 0.135 },
    { id: "benidorm", name: "Benidorm", lat: 38.541, lon: -0.122 },
    { id: "granada",  name: "Granada",  lat: 37.177, lon: -3.598 }
  ];

  /*
   * Ruta visual aproximada por tierra.
   *
   * IMPORTANTE:
   * Los puntos de parada aparecen explícitamente dentro
   * de esta ruta. Así el coche puede detenerse exactamente
   * sobre cada parada.
   */
  const roadRoute = [
    // Tolosa
    [-2.078, 43.135],
    [-2.12, 43.08],
    [-2.20, 43.02],

    // Aizkorri
    [-2.330, 42.960],

    // Hacia Navarra
    [-2.27, 42.88],
    [-2.12, 42.80],

    // Óbanos
    [-1.785, 42.680],

    // Hacia el este / Zaragoza
    [-1.55, 42.55],
    [-1.30, 42.40],
    [-1.05, 42.20],
    [-0.82, 42.00],
    [-0.58, 41.78],
    [-0.35, 41.55],
    [-0.12, 41.30],

    // Corredor hacia Castellón
    [0.00, 41.05],
    [0.08, 40.80],
    [0.12, 40.55],
    [0.14, 40.32],

    // Oropesa
    [0.135, 40.092],

    // Bajando hacia Alicante
    [0.10, 39.88],
    [0.04, 39.68],
    [-0.01, 39.48],
    [-0.06, 39.28],
    [-0.10, 39.05],
    [-0.12, 38.80],

    // Benidorm
    [-0.122, 38.541],

    // Interior hacia Granada
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

    // Granada
    [-3.598, 37.177]
  ];

  const directRoute = [
    [-2.078, 43.135],
    [-3.598, 37.177]
  ];

  const mapElement = document.getElementById("map");

  let svg = null;
  let routePath = null;
  let progressPath = null;
  let projection = null;
  let activeRoute = roadRoute;

  /*
   * Índices EXACTOS de las paradas dentro de roadRoute.
   *
   * Esto es lo que arregla el problema de que el coche
   * no se parase exactamente en Óbanos, Oropesa, etc.
   */
  const roadStopRouteIndexes = {
    tolosa: 0,
    aizkorri: 3,
    obanos: 6,
    oropesa: 17,
    benidorm: 24,
    granada: 38
  };

  function createSvgElement(name, attrs = {}) {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      name
    );

    Object.entries(attrs).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });

    return element;
  }

  function project(lon, lat) {
    return projection(lon, lat);
  }

  function pathFromCoordinates(coords) {
    return coords.map((point, index) => {
      const p = project(point[0], point[1]);

      return `${index === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(" ");
  }

  function renderGeometry(geometry, group) {
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(ring => {
        group.appendChild(
          createSvgElement("path", {
            d: pathFromCoordinates(ring),
            class: "country"
          })
        );
      });

      return;
    }

    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        renderGeometry(
          {
            type: "Polygon",
            coordinates: polygon
          },
          group
        );
      });

      return;
    }

    if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach(item => {
        renderGeometry(item, group);
      });
    }
  }

  function renderStops() {
    stops.forEach((stop, index) => {
      const p = project(stop.lon, stop.lat);

      const dot = createSvgElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 5.5,
        class: "stop-dot",
        "data-stop-index": index
      });

      const label = createSvgElement("text", {
        x: p.x + 10,
        y: p.y - 10,
        class: "stop-label"
      });

      label.textContent = stop.name;

      svg.append(dot, label);
    });
  }

  function drawRoute(route) {
    activeRoute = route;

    routePath.setAttribute(
      "d",
      pathFromCoordinates(route)
    );

    progressPath.setAttribute("d", "");
  }

  function setProgress(routeIndex, fraction) {
    const route = activeRoute;

    if (!route || route.length < 2) return;

    const endIndex = Math.max(
      1,
      Math.min(route.length - 1, routeIndex)
    );

    const points = route.slice(0, endIndex + 1);

    const previous = route[endIndex - 1];
    const current = route[endIndex];

    points.push([
      previous[0] +
        (current[0] - previous[0]) * fraction,

      previous[1] +
        (current[1] - previous[1]) * fraction
    ]);

    progressPath.setAttribute(
      "d",
      pathFromCoordinates(points)
    );
  }

  /*
   * Devuelve la posición exacta correspondiente a una
   * fracción del recorrido.
   */
  function positionAtRouteFraction(fraction) {
    const route = activeRoute;

    if (!route || route.length < 2) {
      return {
        x: 0,
        y: 0,
        angle: 0
      };
    }

    const scaled =
      Math.max(0, Math.min(1, fraction)) *
      (route.length - 1);

    const index = Math.min(
      route.length - 2,
      Math.floor(scaled)
    );

    const t = scaled - index;

    const a = route[index];
    const b = route[index + 1];

    const lon =
      a[0] + (b[0] - a[0]) * t;

    const lat =
      a[1] + (b[1] - a[1]) * t;

    const point = project(lon, lat);

    const nextPoint = project(
      b[0],
      b[1]
    );

    const previousPoint = project(
      a[0],
      a[1]
    );

    const angle =
      Math.atan2(
        nextPoint.y - previousPoint.y,
        nextPoint.x - previousPoint.x
      ) * 180 / Math.PI;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;

    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );

    const offsetX =
      (rect.width - viewBox.width * scale) / 2;

    const offsetY =
      (rect.height - viewBox.height * scale) / 2;

    return {
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
      angle
    };
  }

  /*
   * Devuelve la fracción REAL de una parada.
   */
  function getRoadStopFraction(stopId) {
    const index = roadStopRouteIndexes[stopId];

    if (index === undefined) {
      return 0;
    }

    return index / (roadRoute.length - 1);
  }

  async function init() {
    try {
      const response = await fetch(
        "/tolosa-granada/assets/map/europe.geojson"
      );

      if (!response.ok) {
        throw new Error(
          `GeoJSON: HTTP ${response.status}`
        );
      }

      const geojson = await response.json();

      svg = createSvgElement("svg", {
        viewBox: "0 0 1000 700",
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "Mapa horizontal del recorrido"
      });

      mapElement.replaceChildren(svg);

      /*
       * PROYECCIÓN PLANA.
       *
       * El mapa NO se inclina.
       * El mapa NO gira.
       * El mapa queda completamente horizontal.
       */
      projection = (lon, lat) => ({
        x: ((lon + 6.2) / 10.2) * 1000,
        y: ((44.8 - lat) / 9.0) * 700
      });

      const countries = createSvgElement("g");

      const features =
        geojson.type === "FeatureCollection"
          ? geojson.features
          : geojson.type === "Feature"
            ? [geojson]
            : [{ geometry: geojson }];

      features.forEach(feature => {
        renderGeometry(
          feature.geometry,
          countries
        );
      });

      svg.appendChild(countries);

      routePath = createSvgElement(
        "path",
        {
          class: "travel-route"
        }
      );

      progressPath = createSvgElement(
        "path",
        {
          class: "route-progress"
        }
      );

      svg.append(
        routePath,
        progressPath
      );

      renderStops();

      drawRoute(roadRoute);

      window.TripMap = {
        stops,
        roadRoute,
        directRoute,

        drawRoute,
        setProgress,
        positionAtRouteFraction,
        getRoadStopFraction,

        getRoadStopIndex(stopId) {
          return roadStopRouteIndexes[stopId];
        },

        updateStopStates(
          currentIndex,
          visitedIndexes
        ) {
          svg
            .querySelectorAll(".stop-dot")
            .forEach((dot, index) => {
              dot.classList.toggle(
                "current",
                index === currentIndex
              );

              dot.classList.toggle(
                "visited",
                visitedIndexes.includes(index)
              );
            });
        }
      };

      window.dispatchEvent(
        new Event("trip-map-ready")
      );

    } catch (error) {
      console.error(
        "Error al iniciar el mapa:",
        error
      );

      mapElement.innerHTML =
        '<p class="map-error">' +
        'No se ha podido cargar el mapa. ' +
        'Comprueba que existe assets/map/europe.geojson.' +
        '</p>';
    }
  }

  init();
})();
