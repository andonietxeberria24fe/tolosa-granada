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

  /*
   * Trazado orientativo por tierra.
   * No es una ruta GPS ni una geometría exacta de carreteras.
   * Valencia no se muestra como parada ni como recuerdo.
   */
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
    [0.135, 40.092],
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

  const mapElement = document.getElementById("map");

  let svg;
  let routePath;
  let progressPath;
  let projection;
  let activeRoute = roadRoute;

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.entries(attributes).forEach(([key, value]) => {
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
        group.appendChild(svgElement("path", {
          d: pathFromCoordinates(ring),
          class: "country"
        }));
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        renderGeometry({ type: "Polygon", coordinates: polygon }, group);
      });
    } else if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach(item => renderGeometry(item, group));
    }
  }

  function drawStops() {
    stops.forEach((stop, index) => {
      const p = project(stop.lon, stop.lat);

      const dot = svgElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 5.5,
        class: "stop-dot",
        "data-stop-index": index
      });

      const label = svgElement("text", {
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
    routePath.setAttribute("d", pathFromCoordinates(route));
    progressPath.setAttribute("d", "");
  }

  function setProgress(routeIndex, fraction) {
    const route = activeRoute;
    if (!route || route.length < 2) return;

    const endIndex = Math.max(1, Math.min(route.length - 1, routeIndex));
    const points = route.slice(0, endIndex + 1);
    const previous = route[endIndex - 1];
    const current = route[endIndex];

    points.push([
      previous[0] + (current[0] - previous[0]) * fraction,
      previous[1] + (current[1] - previous[1]) * fraction
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

    const lon = a[0] + (b[0] - a[0]) * t;
    const lat = a[1] + (b[1] - a[1]) * t;
    const point = project(lon, lat);

    const nextPoint = project(b[0], b[1]);
    const previousPoint = project(a[0], a[1]);
    const angle = Math.atan2(
      nextPoint.y - previousPoint.y,
      nextPoint.x - previousPoint.x
    ) * 180 / Math.PI;

    const rect = svg.getBoundingClientRect();
    const viewBox = svg.viewBox.baseVal;
    const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height);
    const offsetX = (rect.width - viewBox.width * scale) / 2;
    const offsetY = (rect.height - viewBox.height * scale) / 2;

    return {
      x: offsetX + point.x * scale,
      y: offsetY + point.y * scale,
      angle
    };
  }

  async function init() {
    try {
      const response = await fetch("/tolosa-granada/assets/map/europe.geojson");
      if (!response.ok) throw new Error(`GeoJSON: HTTP ${response.status}`);

      const geojson = await response.json();

      svg = svgElement("svg", {
        viewBox: "0 0 1000 700",
        preserveAspectRatio: "xMidYMid meet",
        role: "img",
        "aria-label": "Mapa horizontal del recorrido por España"
      });

      mapElement.replaceChildren(svg);

      // Proyección plana: no inclina ni rota el mapa.
      projection = (lon, lat) => ({
        x: ((lon + 6.2) / 10.2) * 1000,
        y: ((44.8 - lat) / 9.0) * 700
      });

      const countries = svgElement("g");
      const features = geojson.type === "FeatureCollection"
        ? geojson.features
        : geojson.type === "Feature"
          ? [geojson]
          : [{ geometry: geojson }];

      features.forEach(feature => renderGeometry(feature.geometry, countries));
      svg.appendChild(countries);

      routePath = svgElement("path", { class: "travel-route" });
      progressPath = svgElement("path", { class: "route-progress" });
      svg.append(routePath, progressPath);

      drawStops();
      drawRoute(roadRoute);

      window.TripMap = {
        stops,
        roadRoute,
        directRoute,
        drawRoute,
        setProgress,
        positionAtRouteFraction,

        updateStopStates(currentIndex, visitedIndexes) {
          svg.querySelectorAll(".stop-dot").forEach((dot, index) => {
            dot.classList.toggle("current", index === currentIndex);
            dot.classList.toggle("visited", visitedIndexes.includes(index));
          });
        }
      };

      window.dispatchEvent(new Event("trip-map-ready"));
    } catch (error) {
      console.error("Error al iniciar el mapa:", error);
      mapElement.innerHTML =
        '<p class="map-error">No se ha podido cargar el mapa. Comprueba que existe assets/map/europe.geojson.</p>';
    }
  }

  init();
})();
