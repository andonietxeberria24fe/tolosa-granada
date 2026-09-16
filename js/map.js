const MAP_FILE = "assets/map/europe.geojson";

const stops = [
  { name: "Tolosa", lon: -2.07, lat: 43.13 },
  { name: "Alegui", lon: -2.10, lat: 43.10 },
  { name: "Aizkorri", lon: -2.33, lat: 42.96 },
  { name: "Óbanos", lon: -1.78, lat: 42.68 },
  { name: "Oropesa", lon: 0.15, lat: 40.09 },
  { name: "Benidorm", lon: -0.13, lat: 38.54 },
  { name: "Granada", lon: -3.60, lat: 37.18 }
];

async function loadMap() {
  const mapElement = document.getElementById("map");
  const statusElement = document.getElementById("status");

  try {
    const response = await fetch(MAP_FILE);

    if (!response.ok) {
      throw new Error(`No se pudo cargar el mapa (${response.status})`);
    }

    const geojson = await response.json();
    drawMap(mapElement, geojson);
    statusElement.textContent = "Ruta preparada. Próximamente, el coche se pondrá en marcha.";
  } catch (error) {
    console.error(error);
    statusElement.textContent =
      "No se pudo cargar el mapa. Comprueba que europe.geojson esté en assets/map/.";
  }
}

function drawMap(container, geojson) {
  const width = 900;
  const height = 560;

  // Encuadre inicial aproximado de España.
  const bounds = {
    minLon: -5.5,
    maxLon: 2.5,
    minLat: 36.5,
    maxLat: 44.2
  };

  const project = (lon, lat) => ({
    x: ((lon - bounds.minLon) / (bounds.maxLon - bounds.minLon)) * width,
    y: height - ((lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * height
  });

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Mapa de España con la ruta de Tolosa a Granada");

  const mapGroup = document.createElementNS(svg.namespaceURI, "g");

  function drawRing(ring) {
    return ring.map(([lon, lat], index) => {
      const point = project(lon, lat);
      return `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`;
    }).join(" ") + " Z";
  }

  function drawGeometry(geometry) {
    if (!geometry) return;

    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(ring => {
        const path = document.createElementNS(svg.namespaceURI, "path");
        path.setAttribute("d", drawRing(ring));
        path.setAttribute("class", "land-shape");
        mapGroup.appendChild(path);
      });
    }

    if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => {
          const path = document.createElementNS(svg.namespaceURI, "path");
          path.setAttribute("d", drawRing(ring));
          path.setAttribute("class", "land-shape");
          mapGroup.appendChild(path);
        });
      });
    }

    if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach(drawGeometry);
    }
  }

  const features = geojson.type === "FeatureCollection"
    ? geojson.features
    : geojson.type === "Feature"
      ? [geojson]
      : [];

  features.forEach(feature => drawGeometry(feature.geometry));

  // Ruta entre las paradas.
  const route = document.createElementNS(svg.namespaceURI, "path");
  const routePoints = stops.map(stop => project(stop.lon, stop.lat));
  route.setAttribute(
    "d",
    routePoints.map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    ).join(" ")
  );
  route.setAttribute("class", "route-line");
  mapGroup.appendChild(route);

  // Marcadores y nombres de las paradas.
  stops.forEach((stop, index) => {
    const point = project(stop.lon, stop.lat);

    const marker = document.createElementNS(svg.namespaceURI, "circle");
    marker.setAttribute("cx", point.x);
    marker.setAttribute("cy", point.y);
    marker.setAttribute("r", index === stops.length - 1 ? "8" : "6");
    marker.setAttribute("class", "stop-marker");
    mapGroup.appendChild(marker);

    const label = document.createElementNS(svg.namespaceURI, "text");
    label.setAttribute("x", point.x + 10);
    label.setAttribute("y", point.y - 10);
    label.setAttribute("class", "stop-label");
    label.textContent = stop.name;
    mapGroup.appendChild(label);
  });

  svg.appendChild(mapGroup);
  container.replaceChildren(svg);
}

loadMap();
