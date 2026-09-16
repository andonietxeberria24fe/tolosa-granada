(() => {
  "use strict";

  const stops = [
    { id: "tolosa", name: "Tolosa", lat: 43.135, lon: -2.078 },
    { id: "aizkorri", name: "Aizkorri", lat: 42.960, lon: -2.330 },
    { id: "obanos", name: "Óbanos", lat: 42.680, lon: -1.785 },
    { id: "oropesa", name: "Oropesa", lat: 40.092, lon: 0.135 },
    { id: "benidorm", name: "Benidorm", lat: 38.541, lon: -0.122 },
    { id: "granada", name: "Granada", lat: 37.177, lon: -3.598 }
  ];

  // Ruta orientativa por tierra. No es una traza GPS exacta.
  // Oropesa → Valencia → Gandía → Dénia → Benidorm.
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

    // Bajada por la costa, manteniéndose en tierra.
    [0.02, 39.85],
    [-0.10, 39.65],
    [-0.30, 39.47],  // Valencia
    [-0.22, 39.20],
    [-0.18, 38.97],  // Gandía
    [0.10, 38.84],   // Dénia
    [-0.02, 38.70],
    [-0.122, 38.541], // Benidorm

    // Hacia Granada por el interior.
    [-0.55, 38.25],
    [-1.20, 37.75],
    [-2.05, 37.35],
    [-3.598, 37.177]
  ];

  // Vuelo ilustrativo directo entre Tolosa y Granada.
  const directRoute = [
    [-2.078, 43.135],
    [-1.70, 42.20],
    [-1.20, 41.20],
    [-0.70, 40.20],
    [-0.30, 39.20],
    [-0.80, 38.50],
    [-1.80, 37.80],
    [-3.598, 37.177]
  ];

  const mapElement = document.getElementById("map");

  let svg;
  let routePath;
  let progressPath;
  let projection;
  let activeRoute = roadRoute;

  function project(lon, lat) {
    return projection ? projection(lon, lat) : { x: 0, y: 0 };
  }

  function pathFromCoordinates(coords, close = false) {
    const path = coords.map((point, index) => {
      const p = project(point[0], point[1]);
      return `${index === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(" ");

    return close ? `${path} Z` : path;
  }

  function createSvgElement(name, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  }

  function renderGeometry(geometry, group) {
    if (!geometry) return;

    const { type, coordinates } = geometry;

    if (type === "Polygon") {
      coordinates.forEach(ring => {
        group.appendChild(createSvgElement("path", {
          d: pathFromCoordinates(ring, true),
          class: "country"
        }));
      });
    } else if (type === "MultiPolygon") {
      coordinates.forEach(poly => {
        renderGeometry({ type: "Polygon", coordinates: poly }, group);
      });
    } else if (type === "GeometryCollection") {
      geometry.geometries.forEach(item => renderGeometry(item, group));
    }
  }

  function renderStops() {
    stops.forEach((stop, index) => {
      const p = project(stop.lon, stop.lat);
      const circle = createSvgElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 5.5,
        class: "stop-dot",
        "data-stop-index": index
      });

      svg.appendChild(circle);
    });
  }

  function drawRoute(route) {
    activeRoute = route;
    routePath.setAttribute("d", pathFromCoordinates(route));
    progressPath.setAttribute("d", "");
  }

  // Dibuja el recorrido completado hasta una fracción de la ruta.
  function setProgress(fraction) {
    const route = activeRoute;
    const scaled = Math.max(0, Math.min(1, fraction)) * (route.length - 1);
    const index = Math.min(route.length - 2, Math.floor(scaled));
    const t = scaled - index;

    const points = route.slice(0, index + 1);
    const a = route[index];
    const b = route[index + 1];

    points.push([
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t
    ]);

    progressPath.setAttribute("d", pathFromCoordinates(points));
  }

  function positionAtRouteFraction(fraction) {
    const route = activeRoute;
    const scaled = Math.max(0, Math.min(1, fraction)) * (route.length - 1);
    const index = Math.min(route.length - 2, Math.floor(scaled));
    const t = scaled - index;

    const a = route[index];
    const b = route[index + 1];

    const p = project(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t
    );

    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    const scale = Math.min(rect.width / vb.width, rect.height / vb.height);
    const offsetX = (rect.width - vb.width * scale) / 2;
    const offsetY = (rect.height - vb.height * scale) / 2;

    return {
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale
    };
  }

  async function init() {
    try {
      const response = await fetch("assets/map/europe.geojson");
      if (!response.ok) throw new Error("No se pudo cargar el GeoJSON");

      const geojson = await response.json();

      svg = createSvgElement("svg", {
        viewBox: "0 0 1000 700",
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "Mapa del recorrido por España"
      });

      mapElement.replaceChildren(svg);

      projection = (lon, lat) => ({
        x: (lon + 6.2) / 10.2 * 1000,
        y: (44.8 - lat) / 9.0 * 700
      });

      const countries = createSvgElement("g");
      const features = geojson.type === "FeatureCollection"
        ? geojson.features
        : [{ type: "Feature", geometry: geojson }];

      features.forEach(feature => renderGeometry(feature.geometry, countries));
      svg.appendChild(countries);

      routePath = createSvgElement("path", { class: "travel-route" });
      progressPath = createSvgElement("path", { class: "route-progress" });

      svg.appendChild(routePath);
      svg.appendChild(progressPath);

      renderStops();
      drawRoute(roadRoute);

      window.TripMap = {
        stops,
        roadRoute,
        directRoute,
        drawRoute,
        setProgress,
        positionAtRouteFraction,

        setVisibleStops(indices) {
          svg.querySelectorAll(".stop-dot").forEach((dot, index) => {
            dot.style.display = indices.includes(index) ? "" : "none";
          });
        },

        updateStopStates(currentIndex, visited) {
          svg.querySelectorAll(".stop-dot").forEach((dot, index) => {
            dot.classList.toggle("current", index === currentIndex);
            dot.classList.toggle("visited", visited.includes(index));
          });
        }
      };
    } catch (error) {
      console.error(error);
      mapElement.innerHTML =
        '<p class="map-error">No se ha podido cargar el mapa. Comprueba que existe <code>assets/map/europe.geojson</code>.</p>';
    }
  }

  init();
})();
