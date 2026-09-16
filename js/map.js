```javascript
(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  const WIDTH = 1000;
  const HEIGHT = 700;

  const stops = [
    { id: "tolosa",   name: "Tolosa",   lon: -2.078, lat: 43.135 },
    { id: "aizkorri", name: "Aizkorri", lon: -2.330, lat: 42.960 },
    { id: "obanos",   name: "Óbanos",   lon: -1.785, lat: 42.680 },
    { id: "oropesa",  name: "Oropesa",  lon:  0.135, lat: 40.092 },
    { id: "benidorm", name: "Benidorm", lon: -0.122, lat: 38.541 },
    { id: "granada",  name: "Granada",  lon: -3.598, lat: 37.177 }
  ];

  function project(lon, lat) {
    return {
      x: ((lon + 6.2) / 10.2) * WIDTH,
      y: ((44.8 - lat) / 9.0) * HEIGHT
    };
  }

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

    /* Oropesa → Benidorm por el interior */
    [0.02, 39.98],
    [-0.12, 39.86],
    [-0.28, 39.72],
    [-0.43, 39.56],
    [-0.56, 39.38],
    [-0.66, 39.20],
    [-0.70, 39.02],
    [-0.67, 38.86],
    [-0.59, 38.73],
    [-0.47, 38.64],
    [-0.32, 38.58],
    [-0.20, 38.55],

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

  const directRoute = [
    [-2.078, 43.135],
    [-3.598, 37.177]
  ];

  const roadStopRouteIndexes = {
    tolosa: 0,
    aizkorri: 3,
    obanos: 6,
    oropesa: 20,
    benidorm: 33,
    granada: 45
  };

  let svg = null;
  let routePath = null;
  let progressPath = null;
  let vehicle = null;
  let vehicleText = null;

  let currentRoute = directRoute;
  let currentMode = "direct";

  function createSvgElement(tag, attributes = {}) {
    const element = document.createElementNS(NS, tag);

    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });

    return element;
  }

  function routeToPath(route) {
    return route.map((point, index) => {
      const p = project(point[0], point[1]);

      return `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`;
    }).join(" ");
  }

  function drawGeoJson(data) {
    const group = createSvgElement("g", {
      class: "countries"
    });

    const features =
      data.type === "FeatureCollection"
        ? data.features
        : [data];

    features.forEach(feature => {
      if (!feature.geometry) return;

      const geometry = feature.geometry;

      if (geometry.type === "Polygon") {
        drawPolygon(geometry.coordinates, group);
      }

      if (geometry.type === "MultiPolygon") {
        geometry.coordinates.forEach(polygon => {
          drawPolygon(polygon, group);
        });
      }
    });

    svg.insertBefore(group, svg.children[1]);
  }

  function drawPolygon(polygon, parent) {
    const path = createSvgElement("path", {
      class: "country"
    });

    let d = "";

    polygon.forEach(ring => {
      ring.forEach((coordinate, index) => {
        const p = project(
          coordinate[0],
          coordinate[1]
        );

        d += `${index === 0 ? "M" : "L"} ${p.x} ${p.y} `;
      });

      d += "Z ";
    });

    path.setAttribute("d", d);

    parent.appendChild(path);
  }

  function drawStops() {
    const group = createSvgElement("g", {
      class: "stops"
    });

    stops.forEach(stop => {
      const p = project(stop.lon, stop.lat);

      const stopGroup = createSvgElement("g", {
        class: `stop stop-${stop.id}`,
        "data-stop": stop.id
      });

      const circle = createSvgElement("circle", {
        cx: p.x,
        cy: p.y,
        r: 8,
        class: "stop-dot"
      });

      stopGroup.appendChild(circle);
      group.appendChild(stopGroup);
    });

    svg.appendChild(group);
  }

  function createVehicle() {
    vehicle = createSvgElement("g", {
      id: "svg-trip-vehicle"
    });

    vehicleText = createSvgElement("text", {
      x: 0,
      y: 0,
      class: "vehicle-emoji",
      "text-anchor": "middle",
      "dominant-baseline": "middle"
    });

    vehicleText.textContent = "✈️";

    vehicle.appendChild(vehicleText);
    svg.appendChild(vehicle);
  }

  function setVehicleType(mode) {
    if (!vehicleText) return;

    vehicleText.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";
  }

  /*
   * Coloca vehículo Y línea usando exactamente
   * la misma distancia del mismo path.
   *
   * Así la línea jamás se queda detrás.
   */
  function positionVehicle(fraction) {
    if (!vehicle || !routePath || !progressPath) {
      return;
    }

    fraction = Math.max(
      0,
      Math.min(1, Number(fraction) || 0)
    );

    const total = routePath.getTotalLength();

    const distance = total * fraction;

    const point = routePath.getPointAtLength(distance);

    /*
     * Dirección instantánea.
     */
    const sample = Math.max(
      3,
      Math.min(15, total * 0.008)
    );

    const before = routePath.getPointAtLength(
      Math.max(0, distance - sample)
    );

    const after = routePath.getPointAtLength(
      Math.min(total, distance + sample)
    );

    const dx = after.x - before.x;
    const dy = after.y - before.y;

    /*
     * Ángulo real de desplazamiento.
     */
    let angle = Math.atan2(dy, dx) * 180 / Math.PI;

    /*
     * Los emojis vienen con una orientación
     * que no coincide con nuestra ruta.
     *
     * El ajuste de 180º hace que:
     *
     * ✈️ vaya punta abajo-izquierda
     * 🚙 vaya en la dirección del recorrido.
     */
    if (currentMode === "direct") {
      angle += 135;
    } else {
      angle += 0;
    }

    /*
     * Evitamos giros raros al principio/final.
     */
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) {
      angle = currentMode === "direct"
        ? 135
        : 180;
    }

    vehicle.setAttribute(
      "transform",
      `translate(${point.x} ${point.y}) rotate(${angle})`
    );

    /*
     * LA LÍNEA USA EXACTAMENTE LA MISMA FRACCIÓN.
     */
    const lineLength = total;

    progressPath.style.strokeDasharray =
      `${lineLength} ${lineLength}`;

    progressPath.style.strokeDashoffset =
      `${lineLength - (lineLength * fraction)}`;

    /*
     * Casos extremos exactos.
     */
    if (fraction <= 0) {
      progressPath.style.strokeDashoffset =
        `${lineLength}`;
    }

    if (fraction >= 1) {
      progressPath.style.strokeDashoffset =
        "0";
    }

    return {
      x: point.x,
      y: point.y
    };
  }

  /*
   * Esta función queda pública para app.js.
   * NO anima por separado.
   */
  function setProgress(fraction) {
    positionVehicle(fraction);
  }

  /*
   * Calculamos la fracción de cada parada usando
   * la MISMA geometría que usa SVG.
   */
  function getRoadStopFraction(id) {
    const index = roadStopRouteIndexes[id];

    if (index === undefined) {
      return 0;
    }

    if (index === 0) {
      return 0;
    }

    if (index >= roadRoute.length - 1) {
      return 1;
    }

    const temporaryPath = createSvgElement("path", {
      d: routeToPath(
        roadRoute.slice(0, index + 1)
      )
    });

    const partialLength =
      temporaryPath.getTotalLength();

    const totalLength =
      routePath.getTotalLength();

    if (!totalLength) {
      return 0;
    }

    return partialLength / totalLength;
  }

  function setMode(mode) {
    currentMode =
      mode === "real"
        ? "real"
        : "direct";

    currentRoute =
      currentMode === "real"
        ? roadRoute
        : directRoute;

    const pathData =
      routeToPath(currentRoute);

    routePath.setAttribute(
      "d",
      pathData
    );

    progressPath.setAttribute(
      "d",
      pathData
    );

    /*
     * Elimina cualquier estado anterior.
     */
    progressPath.style.transition = "none";
    progressPath.style.strokeDasharray = "none";
    progressPath.style.strokeDashoffset = "0";

    setVehicleType(currentMode);

    stops.forEach(stop => {
      const element =
        svg.querySelector(
          `.stop-${stop.id}`
        );

      if (!element) return;

      const visible =
        currentMode === "real"
          ? true
          : (
              stop.id === "tolosa" ||
              stop.id === "granada"
            );

      element.style.display =
        visible ? "" : "none";
    });

    /*
     * MUY IMPORTANTE:
     * primero ponemos la línea a cero.
     */
    requestAnimationFrame(() => {
      const total =
        routePath.getTotalLength();

      progressPath.style.strokeDasharray =
        `${total} ${total}`;

      progressPath.style.strokeDashoffset =
        `${total}`;

      positionVehicle(0);
    });
  }

  async function drawMap() {
    const map =
      document.getElementById("map");

    svg = createSvgElement("svg", {
      viewBox:
        `0 0 ${WIDTH} ${HEIGHT}`,

      preserveAspectRatio:
        "xMidYMid meet",

      "aria-hidden":
        "true"
    });

    map.replaceChildren(svg);

    const background =
      createSvgElement("rect", {
        x: 0,
        y: 0,
        width: WIDTH,
        height: HEIGHT,
        class: "map-background"
      });

    svg.appendChild(background);

    try {
      const response =
        await fetch(
          "/tolosa-granada/assets/map/europe.geojson"
        );

      if (response.ok) {
        const geojson =
          await
```
