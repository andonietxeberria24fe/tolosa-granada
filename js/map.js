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
    [-1.45, 42.45],
    [-1.20, 42.25],
    [-0.85, 41.95],
    [-0.55, 41.65],
    [-0.25, 41.35],
    [-0.10, 41.15],
    [-0.05, 40.95],
    [0.02, 40.75],
    [0.10, 40.55],
    [0.13, 40.30],
    [0.13, 40.092],
    [0.08, 39.90],
    [0.02, 39.70],
    [-0.02, 39.45],
    [-0.08, 39.15],
    [-0.12, 38.85],
    [-0.122, 38.541],
    [-0.30, 38.45],
    [-0.55, 38.25],
    [-0.90, 38.05],
    [-1.20, 37.75],
    [-1.60, 37.55],
    [-2.05, 37.35],
    [-2.60, 37.25],
    [-3.10, 37.20],
    [-3.598, 37.177]
  ];

  const directRoute = [
    [-2.078, 43.135],
    [-3.598, 37.177]
  ];

  const roadStopIndexes = {
    tolosa: 0,
    aizkorri: 2,
    obanos: 4,
    oropesa: 15,
    benidorm: 21,
    granada: 30
  };

  const mapElement = document.getElementById("map");

  let svg;
  let routePath;
  let progressPath;
  let projection;
  let activeRoute = roadRoute;

  function createSvgElement(name, attrs = {}) {
    const node = document.createElementNS(
      "http://www.w3.org/2000/svg",
      name
    );

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
        group.appendChild(createSvgElement("path", {
          d: pathFromCoordinates(ring),
          class: "country"
        }));
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

      svg.appendChild(createSvgElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 5.5,
        class: "stop-dot",
        "data-stop-index": index
      }));
    });
  }

  function drawRoute(mode) {
    activeRoute = mode === "direct" ? directRoute : roadRoute;

    routePath.setAttribute("d", pathFromCoordinates(activeRoute));
    progressPath.setAttribute("d", "");
  }

  function routeLengths(route) {
    const lengths = [0];
    let total = 0;

    for (let i = 1; i < route.length; i++) {
      const a = project(route[i - 1][0], route[i - 1][1]);
      const b = project(route[i][0], route[i][1]);
      total += Math.hypot(b.x - a.x, b.y - a.y);
      lengths.push(total);
    }

    return { lengths, total };
  }

  // Dibuja la ruta completa hasta la fracción indicada: 0–1.
  function setProgress(_routeIndex, fraction) {
    if (!activeRoute || activeRoute.length < 2) return;

    const safe = Math.max(0, Math.min(1, fraction));
    const { lengths, total } = routeLengths(activeRoute);
    if (!total) return;

    const targetDistance = total * safe;
    const points = [activeRoute[0]];

    for (let i = 1; i < activeRoute.length; i++) {
      if (lengths[i] < targetDistance) {
        points.push(activeRoute[i]);
        continue;
      }

      const segmentLength = lengths[i] - lengths[i - 1];
      const t = segmentLength
        ? (targetDistance - lengths[i - 1]) / segmentLength
        : 0;

      const a = activeRoute[i - 1];
      const b = activeRoute[i];

      points.push([
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t
      ]);
      break;
    }

    progressPath.setAttribute("d", pathFromCoordinates(points));
  }

  function positionAtRouteFraction(fraction) {
    const route = activeRoute;
    const safe = Math.max(0, Math.min(1, fraction));
    const { lengths, total } = routeLengths(route);

    if (!total) return null;

    const targetDistance = total * safe;
    let index = 1;

    while (index < lengths.length - 1 && lengths[index] < targetDistance) {
      index++;
    }

    const segmentLength = lengths[index] - lengths[index - 1];
    const t = segmentLength
      ? (targetDistance - lengths[index - 1]) / segmentLength
      : 0;

    const a = route[index - 1];
    const b = route[index];

    const p = project(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t
    );

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const scale = Math.min(
      rect.width / viewBox.width,
      rect.height / viewBox.height
    );

    return {
      x: (rect.width - viewBox.width * scale) / 2 + p.x * scale,
      y: (rect.height - viewBox.height * scale) / 2 + p.y * scale
    };
  }

  function getStopFraction(stopId) {
    if (activeRoute === directRoute) {
      return stopId === "tolosa" ? 0 : stopId === "granada" ? 1 : NaN;
    }

    const targetIndex = roadStopIndexes[stopId];
    if (targetIndex === undefined) return NaN;

    const { lengths, total } = routeLengths(roadRoute);
    return total ? lengths[targetIndex] / total : 0;
  }

  function updateStopStates(currentIndex, visited = []) {
    if (!svg) return;

    svg.querySelectorAll(".stop-dot").forEach((dot, index) => {
      dot.classList.toggle("current", index === currentIndex);
      dot.classList.toggle("visited", visited.includes(index));
    });
  }

  async function init() {
    try {
      // Ruta relativa: también funciona si la web está en una subcarpeta.
      const response = await fetch("assets/map/europe.geojson");

      if (!response.ok) {
        throw new Error(`GeoJSON: HTTP ${response.status}`);
      }

      const geojson = await response.json();

      svg = createSvgElement("svg", {
        viewBox: "0 0 1000 700",
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "Mapa del recorrido por España"
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

      routePath = createSvgElement("path", { class: "travel-route" });
      progressPath = createSvgElement("path", { class: "route-progress" });
      svg.append(routePath, progressPath);

      renderStops();
      drawRoute("real");

      window.TripMap = {
        ready: true,
        stops,
        roadRoute,
        directRoute,
        drawRoute,
        setProgress,
        positionAtRouteFraction,
        getStopFraction,
        updateStopStates,
        projectStop(index) {
          const stop = stops[index];
          return stop ? project(stop.lon, stop.lat) : null;
        }
      };

      document.dispatchEvent(new CustomEvent("trip-map-ready"));
    } catch (error) {
      console.error("Error al iniciar el mapa:", error);
      mapElement.innerHTML = `
        <p class="map-error">
          No se ha podido cargar el mapa.
          Comprueba que existe assets/map/europe.geojson y que la ruta es correcta.
        </p>
      `;
    }
  }

  init();
})();
