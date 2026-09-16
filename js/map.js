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
    [0.13, 40.09],
    [0.05, 39.75],
    [-0.02, 39.45],
    [-0.12, 38.95],
    [-0.122, 38.541],
    [-0.55, 38.25],
    [-1.20, 37.75],
    [-2.05, 37.35],
    [-3.598, 37.177]
  ];

  const directRoute = [
    [-2.078, 43.135],
    [-1.7, 42.2],
    [-1.2, 41.2],
    [-0.7, 40.2],
    [-0.3, 39.2],
    [-0.8, 38.5],
    [-1.8, 37.8],
    [-3.598, 37.177]
  ];

  const mapElement = document.getElementById("map");

  let svg;
  let routePath;
  let progressPath;
  let projection;
  let activeRoute = roadRoute;

  function createSvgElement(name, attrs = {}) {
    const node = document.createElementNS("http://www.w3.org/2000/svg", name);

    Object.entries(attrs).forEach(([key, value]) => {
      node.setAttribute(key, String(value));
    });

    return node;
  }

  function project(lon, lat) {
    return projection
      ? projection(lon, lat)
      : { x: 0, y: 0 };
  }

  function pathFromCoordinates(coords) {
    return coords.map((point, index) => {
      const p = project(point[0], point[1]);
      return `${index === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    }).join(" ");
  }

  function renderGeometry(geometry, group) {
    if (!geometry) return;

    const { type, coordinates } = geometry;

    if (type === "Polygon") {
      coordinates.forEach(ring => {
        const path = createSvgElement("path", {
          d: pathFromCoordinates(ring),
          fill: "#f0f2f5",
          stroke: "#dce1e7",
          "stroke-width": "0.65",
          "stroke-linejoin": "round",
          "vector-effect": "non-scaling-stroke"
        });

        group.appendChild(path);
      });

      return;
    }

    if (type === "MultiPolygon") {
      coordinates.forEach(polygon => {
        renderGeometry({ type: "Polygon", coordinates: polygon }, group);
      });

      return;
    }

    if (type === "GeometryCollection") {
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
        fill: "#ffffff",
        stroke: "#9ba8b8",
        "stroke-width": "2.5",
        "data-stop-index": index,
        class: "stop-dot"
      });

      svg.appendChild(circle);
    });
  }

  function drawRoute(route) {
    activeRoute = route;
    routePath.setAttribute("d", pathFromCoordinates(route));
    progressPath.setAttribute("d", "");
  }

  function setProgress(routeIndex, fraction) {
    const route = activeRoute;
    if (!route || route.length < 2) return;

    const end = Math.max(1, Math.min(route.length - 1, routeIndex));
    const points = route.slice(0, end + 1);
    const last = route[end];
    const prev = route[end - 1];

    points.push([
      prev[0] + (last[0] - prev[0]) * fraction,
      prev[1] + (last[1] - prev[1]) * fraction
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
    const viewBox = svg.viewBox.baseVal;
    const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
    const offsetX = (rect.width - viewBox.width * scale) / 2;
    const offsetY = (rect.height - viewBox.height * scale) / 2;

    return {
      x: offsetX + p.x * scale,
      y: offsetY + p.y * scale
    };
  }

  async function init() {
    try {
      const response = await fetch("./assets/map/europe.geojson");

      if (!response.ok) {
        throw new Error(`No se pudo cargar el GeoJSON: HTTP ${response.status}`);
      }

      const geojson = await response.json();

      svg = createSvgElement("svg", {
        viewBox: "0 0 1000 700",
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "Mapa del recorrido por España",
        width: "100%",
        height: "100%"
      });

      mapElement.replaceChildren(svg);

      projection = (lon, lat) => ({
        x: ((lon + 6.2) / 10.2) * 1000,
        y: ((44.8 - lat) / 9.0) * 700
      });

      const countries = createSvgElement("g");

      const features = geojson.type === "FeatureCollection"
        ? geojson.features
        : geojson.type === "Feature"
          ? [geojson]
          : [{ geometry: geojson }];

      features.forEach(feature => renderGeometry(feature.geometry, countries));
      svg.appendChild(countries);

      routePath = createSvgElement("path", {
        d: "",
        fill: "none",
        stroke: "#aab6c5",
        "stroke-width": "3",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "travel-route"
      });

      progressPath = createSvgElement("path", {
        d: "",
        fill: "none",
        stroke: "#64748b",
        "stroke-width": "3.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "route-progress"
      });

      svg.append(routePath, progressPath);
      renderStops();
      drawRoute(roadRoute);

      window.TripMap = {
        stops,
        roadRoute,
        directRoute,
        drawRoute,
        setProgress,
        positionAtRouteFraction,

        projectStop(index) {
          const stop = stops[index];
          return project(stop.lon, stop.lat);
        },

        updateStopStates(currentIndex, visited) {
          svg.querySelectorAll(".stop-dot").forEach((dot, index) => {
            dot.classList.toggle("current", index === currentIndex);
            dot.classList.toggle("visited", visited.includes(index));
          });
        }
      };
    } catch (error) {
      console.error("Error al iniciar el mapa:", error);

      mapElement.innerHTML = `
        <p class="map-error">
          No se ha podido cargar el mapa. Comprueba que existe
          <code>assets/map/europe.geojson</code> y revisa la consola.
        </p>
      `;
    }
  }

  init();
})();
