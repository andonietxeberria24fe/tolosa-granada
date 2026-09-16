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

  // Puntos orientativos por tierra. No son coordenadas GPS de carretera.
  const roadRoute = [
    [-2.078,43.135],
    [-2.16,43.05],
    [-2.33,42.96],
    [-2.15,42.83],
    [-1.785,42.68],
    [-1.45,42.45],
    [-1.20,42.25],
    [-0.85,41.95],
    [-0.55,41.65],
    [-0.25,41.35],
    [-0.10,41.15],
    [-0.05,40.95],
    [0.02,40.75],
    [0.10,40.55],
    [0.13,40.30],
    [0.13,40.09],
    [0.08,39.90],
    [0.02,39.70],
    [-0.02,39.45],
    [-0.08,39.15],
    [-0.12,38.85],
    [-0.122,38.541],
    [-0.30,38.45],
    [-0.55,38.25],
    [-0.90,38.05],
    [-1.20,37.75],
    [-1.60,37.55],
    [-2.05,37.35],
    [-2.60,37.25],
    [-3.10,37.20],
    [-3.598,37.177]
  ];

  // Vuelo directo visual: solo los extremos.
  const directRoute = [
    [-2.078,43.135],
    [-3.598,37.177]
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
    return projection ? projection(lon, lat) : { x: 0, y: 0 };
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
          class: "country",
          fill: "#e9edf2",
          stroke: "#cbd3dd",
          "stroke-width": "0.65",
          "stroke-linejoin": "round"
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
      svg.appendChild(createSvgElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 5.5,
        class: "stop-dot",
        "data-stop-index": index
      }));
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
      const response = await fetch("/tolosa-granada/assets/map/europe.geojson");
      if (!response.ok) throw new Error(`GeoJSON: HTTP ${response.status}`);

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
      mapElement.innerHTML =
        '<p class="map-error">No se ha podido cargar el mapa. Comprueba el GeoJSON y revisa la consola.</p>';
    }
  }

  init();
})();
