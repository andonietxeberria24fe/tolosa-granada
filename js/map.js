(() => {
  const MAP_FILE = "assets/map/europe.geojson";

  // Coordenadas aproximadas para situar las paradas.
  // Después podemos ajustar la posición visual de cada punto.
  const stops = [
    { name: "Tolosa", lat: 43.135, lon: -2.078 },
    { name: "Alegui", lat: 43.100, lon: -2.095 },
    { name: "Aizkorri", lat: 42.960, lon: -2.330 },
    { name: "Óbanos", lat: 42.680, lon: -1.785 },
    { name: "Oropesa", lat: 40.092, lon: 0.135 },
    { name: "Benidorm", lat: 38.541, lon: -0.122 },
    { name: "Granada", lat: 37.177, lon: -3.598 }
  ];

  const bounds = {
    minLon: -5.8,
    maxLon: 2.8,
    minLat: 36.2,
    maxLat: 44.6
  };

  const svgNS = "http://www.w3.org/2000/svg";
  let svg;
  let routePath;
  let car;
  let markerElements = [];
  let mapReady = false;

  function project(lon, lat) {
    const width = svg.clientWidth || 1000;
    const height = svg.clientHeight || 700;
    const mapWidth = bounds.maxLon - bounds.minLon;
    const mapHeight = bounds.maxLat - bounds.minLat;

    // Ajuste de proporción aproximado para latitudes de España.
    const xRatio = (lon - bounds.minLon) / mapWidth;
    const yRatio = (bounds.maxLat - lat) / mapHeight;

    const scale = Math.min(width / mapWidth, height / mapHeight);
    const drawnWidth = mapWidth * scale;
    const drawnHeight = mapHeight * scale;
    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    return {
      x: offsetX + xRatio * drawnWidth,
      y: offsetY + yRatio * drawnHeight
    };
  }

  function createSvgElement(name, attributes = {}) {
    const element = document.createElementNS(svgNS, name);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  }

  function ringToPath(ring) {
    return ring.map(([lon, lat], index) => {
      const point = project(lon, lat);
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    }).join(" ") + " Z";
  }

  function drawGeometry(geometry, group) {
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(ring => {
        group.appendChild(createSvgElement("path", {
          d: ringToPath(ring),
          class: "country"
        }));
      });
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          group.appendChild(createSvgElement("path", {
            d: ringToPath(ring),
            class: "country"
          }));
        });
      });
    } else if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach(item => drawGeometry(item, group));
    }
  }

  function makeRoutePath(routeStops) {
    const points = routeStops.map(stop => project(stop.lon, stop.lat));
    if (!points.length) return "";

    // Curvas suaves entre los puntos; no pretende ser un trazado GPS.
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length; i++) {
      const previous = points[i - 1];
      const current = points[i];
      const middleX = (previous.x + current.x) / 2;
      const middleY = (previous.y + current.y) / 2;

      d += ` Q ${middleX} ${middleY} ${current.x} ${current.y}`;
    }

    return d;
  }

  function drawStops(group) {
    markerElements = [];

    stops.forEach((stop, index) => {
      const point = project(stop.lon, stop.lat);
      const marker = createSvgElement("circle", {
        cx: point.x,
        cy: point.y,
        r: index === 0 || index === stops.length - 1 ? 7 : 5.5,
        class: "stop-dot",
        "data-stop-index": index
      });

      group.appendChild(marker);
      markerElements.push(marker);
    });
  }

  function updateMapLayout() {
    if (!mapReady) return;

    routePath.setAttribute("d", makeRoutePath(stops));

    stops.forEach((stop, index) => {
      const point = project(stop.lon, stop.lat);
      markerElements[index].setAttribute("cx", point.x);
      markerElements[index].setAttribute("cy", point.y);
    });

    if (window.TripApp) {
      window.TripApp.positionCar();
    }
  }

  async function init() {
    const container = document.getElementById("map");
    car = document.getElementById("car");

    svg = createSvgElement("svg", {
      viewBox: "0 0 1000 700",
      preserveAspectRatio: "xMidYMid meet",
      role: "img",
      "aria-label": "Mapa de España con la ruta de Tolosa a Granada"
    });

    // Dibujamos con un sistema de coordenadas fijo para que el SVG
    // mantenga la proporción al cambiar el tamaño de pantalla.
    const width = 1000;
    const height = 700;
    const mapWidth = bounds.maxLon - bounds.minLon;
    const mapHeight = bounds.maxLat - bounds.minLat;
    const scale = Math.min(width / mapWidth, height / mapHeight);
    const drawnWidth = mapWidth * scale;
    const drawnHeight = mapHeight * scale;
    const offsetX = (width - drawnWidth) / 2;
    const offsetY = (height - drawnHeight) / 2;

    // Reemplaza project por una proyección fija que coincide con el viewBox.
    project = function (lon, lat) {
      return {
        x: offsetX + ((lon - bounds.minLon) / mapWidth) * drawnWidth,
        y: offsetY + ((bounds.maxLat - lat) / mapHeight) * drawnHeight
      };
    };

    const response = await fetch(MAP_FILE);
    if (!response.ok) {
      throw new Error(`No se pudo cargar ${MAP_FILE}`);
    }

    const geojson = await response.json();
    const features = geojson.type === "FeatureCollection"
      ? geojson.features
      : geojson.type === "Feature"
        ? [geojson]
        : [];

    const landGroup = createSvgElement("g");
    features.forEach(feature => drawGeometry(feature.geometry, landGroup));
    svg.appendChild(landGroup);

    routePath = createSvgElement("path", {
      d: makeRoutePath(stops),
      class: "travel-route"
    });
    svg.appendChild(routePath);

    const stopGroup = createSvgElement("g");
    drawStops(stopGroup);
    svg.appendChild(stopGroup);

    container.replaceChildren(svg);
    mapReady = true;

    window.addEventListener("resize", updateMapLayout);
    updateMapLayout();
  }

  function setCurrentStop(index) {
    markerElements.forEach((marker, markerIndex) => {
      marker.classList.toggle("current", markerIndex === index);
    });
  }

  function getStopPosition(index) {
    return project(stops[index].lon, stops[index].lat);
  }

  function setDirectMode(enabled) {
    if (routePath) {
      routePath.classList.toggle("direct", enabled);
    }
  }

  window.TripMap = {
    stops,
    init,
    getStopPosition,
    setCurrentStop,
    setDirectMode
  };
})();
