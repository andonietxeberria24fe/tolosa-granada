(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";

  const WIDTH = 1000;
  const HEIGHT = 700;

  const stops = [
    {
      id: "tolosa",
      name: "Tolosa",
      lon: -2.078,
      lat: 43.135
    },
    {
      id: "aizkorri",
      name: "Aizkorri",
      lon: -2.330,
      lat: 42.960
    },
    {
      id: "obanos",
      name: "Óbanos",
      lon: -1.785,
      lat: 42.680
    },
    {
      id: "oropesa",
      name: "Oropesa",
      lon: 0.135,
      lat: 40.092
    },
    {
      id: "benidorm",
      name: "Benidorm",
      lon: -0.122,
      lat: 38.541
    },
    {
      id: "granada",
      name: "Granada",
      lon: -3.598,
      lat: 37.177
    }
  ];


  /*
   * MISMA PROYECCIÓN PARA TODO:
   * mapa
   * ruta
   * puntos
   * etiquetas
   * coche/avión
   */

  function project(lon, lat) {

    const x =
      ((lon + 6.2) / 10.2) * WIDTH;

    const y =
      ((44.8 - lat) / 9.0) * HEIGHT;

    return { x, y };
  }


  /*
   * RUTA TERRESTRE
   */

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

    [0.08, 39.88],
    [0.00, 39.68],
    [-0.08, 39.48],
    [-0.12, 39.28],

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


  /*
   * VIAJE DIRECTO
   */

  const directRoute = [
    [-2.078, 43.135],
    [-3.598, 37.177]
  ];


  const roadStopRouteIndexes = {
    tolosa: 0,
    aizkorri: 3,
    obanos: 6,
    oropesa: 21,
    benidorm: 26,
    granada: 38
  };


  let svg = null;
  let routePath = null;
  let progressPath = null;
  let vehicle = null;

  let currentMode = "direct";
  let currentRoute = directRoute;


  /*
   * CREAR ELEMENTO SVG
   */

  function createSvgElement(tag, attributes = {}) {

    const element =
      document.createElementNS(NS, tag);

    Object.entries(attributes).forEach(
      ([key, value]) => {
        element.setAttribute(key, value);
      }
    );

    return element;
  }


  /*
   * RUTA → PATH
   */

  function routeToPath(route) {

    return route
      .map((point, index) => {

        const p =
          project(point[0], point[1]);

        return `${index === 0 ? "M" : "L"} ${p.x} ${p.y}`;

      })
      .join(" ");
  }


  /*
   * LONGITUD DE SEGMENTOS
   */

  function routeLengths(route) {

    const lengths = [0];

    let total = 0;

    for (let i = 1; i < route.length; i++) {

      const a =
        project(
          route[i - 1][0],
          route[i - 1][1]
        );

      const b =
        project(
          route[i][0],
          route[i][1]
        );

      const distance =
        Math.hypot(
          b.x - a.x,
          b.y - a.y
        );

      total += distance;

      lengths.push(total);
    }

    return {
      lengths,
      total
    };
  }


  /*
   * GEOJSON
   */

  function drawGeoJson(data) {

    const countriesGroup =
      createSvgElement("g", {
        class: "countries"
      });

    const features =
      data.type === "FeatureCollection"
        ? data.features
        : [data];


    features.forEach(feature => {

      if (!feature.geometry) return;

      const geometry =
        feature.geometry;


      if (geometry.type === "Polygon") {

        drawPolygon(
          geometry.coordinates,
          countriesGroup
        );

      }


      if (geometry.type === "MultiPolygon") {

        geometry.coordinates.forEach(
          polygon => {

            drawPolygon(
              polygon,
              countriesGroup
            );

          }
        );

      }

    });


    svg.appendChild(countriesGroup);
  }


  function drawPolygon(
    polygon,
    parent
  ) {

    const path =
      createSvgElement("path", {
        class: "country"
      });


    let d = "";


    polygon.forEach(ring => {

      ring.forEach((coordinate, index) => {

        const p =
          project(
            coordinate[0],
            coordinate[1]
          );


        d +=
          `${index === 0 ? "M" : "L"} ${p.x} ${p.y} `;

      });

      d += "Z ";

    });


    path.setAttribute("d", d);

    parent.appendChild(path);
  }


  /*
   * DIBUJAR PARADAS
   */

  function drawStops() {

    const group =
      createSvgElement("g", {
        class: "stops"
      });


    const labelOffsets = {

      tolosa: {
        x: 15,
        y: -13
      },

      aizkorri: {
        x: 15,
        y: 25
      },

      obanos: {
        x: 15,
        y: 22
      },

      oropesa: {
        x: 15,
        y: -13
      },

      benidorm: {
        x: 15,
        y: 22
      },

      granada: {
        x: 15,
        y: -13
      }

    };


    stops.forEach(stop => {

      const p =
        project(
          stop.lon,
          stop.lat
        );


      const stopGroup =
        createSvgElement("g", {
          class: `stop stop-${stop.id}`,
          "data-stop": stop.id
        });


      const circle =
        createSvgElement("circle", {
          cx: p.x,
          cy: p.y,
          r: 8,
          class: "stop-dot"
        });


      const offset =
        labelOffsets[stop.id];


      const label =
        createSvgElement("text", {
          x: p.x + offset.x,
          y: p.y + offset.y,
          class: "stop-label"
        });


      label.textContent =
        stop.name;


      stopGroup.appendChild(circle);
      stopGroup.appendChild(label);

      group.appendChild(stopGroup);

    });


    svg.appendChild(group);
  }


  /*
   * VEHÍCULO DENTRO DEL SVG
   *
   * Esto elimina el problema de escala
   * que tenía el coche respecto al mapa.
   */

  function createVehicle() {

    const group =
      createSvgElement("g", {
        id: "vehicle"
      });


    const text =
      createSvgElement("text", {
        x: 0,
        y: 0,
        class: "vehicle-emoji",
        "text-anchor": "middle"
      });


    text.textContent = "✈️";


    group.appendChild(text);

    svg.appendChild(group);

    vehicle = group;
  }


  /*
   * CAMBIAR AVIÓN / COCHE
   */

  function setVehicleType(mode) {

    if (!vehicle) return;

    const text =
      vehicle.querySelector(".vehicle-emoji");

    if (!text) return;

    text.textContent =
      mode === "direct"
        ? "✈️"
        : "🚙";
  }


  /*
   * POSICIÓN DEL VEHÍCULO
   */

  function positionAtRouteFraction(
    fraction
  ) {

    const route =
      currentRoute;


    if (fraction <= 0) {

      return project(
        route[0][0],
        route[0][1]
      );

    }


    if (fraction >= 1) {

      const last =
        route[route.length - 1];

      return project(
        last[0],
        last[1]
      );

    }


    const info =
      routeLengths(route);


    const target =
      info.total * fraction;


    let segment = 1;


    while (
      segment < info.lengths.length &&
      info.lengths[segment] < target
    ) {

      segment++;

    }


    const previousLength =
      info.lengths[segment - 1];

    const segmentLength =
      info.lengths[segment] -
      previousLength;


    const local =
      segmentLength === 0
        ? 0
        : (
            target -
            previousLength
          ) / segmentLength;


    const a =
      route[segment - 1];

    const b =
      route[segment];


    const lon =
      a[0] +
      (b[0] - a[0]) * local;


    const lat =
      a[1] +
      (b[1] - a[1]) * local;


    return project(lon, lat);
  }


  function moveVehicle(fraction) {

    if (!vehicle) return;

    const p =
      positionAtRouteFraction(fraction);


    vehicle.setAttribute(
      "transform",
      `translate(${p.x} ${p.y})`
    );
  }


  /*
   * FRACCIÓN DE CADA PARADA
   */

  function getRoadStopFraction(id) {

    const index =
      roadStopRouteIndexes[id];


    if (index === undefined) {
      return 0;
    }


    const info =
      routeLengths(roadRoute);


    return (
      info.lengths[index] /
      info.total
    );
  }


  /*
   * PROGRESO
   */

  function setProgress(fraction) {

    if (!progressPath) return;

    const length =
      routePath.getTotalLength();


    progressPath.style.strokeDasharray =
      `${length}`;

    progressPath.style.strokeDashoffset =
      `${length * (1 - fraction)}`;
  }


  /*
   * MODO
   */

  function setMode(mode) {

    currentMode =
      mode === "real"
        ? "real"
        : "direct";


    currentRoute =
      currentMode === "real"
        ? roadRoute
        : directRoute;


    setVehicleType(currentMode);


    routePath.setAttribute(
      "d",
      routeToPath(currentRoute)
    );


    progressPath.setAttribute(
      "d",
      routeToPath(currentRoute)
    );


    const visibleStops =
      currentMode === "real"
        ? stops
        : [stops[0], stops[stops.length - 1]];


    stops.forEach(stop => {

      const element =
        svg.querySelector(
          `.stop-${stop.id}`
        );


      if (!element) return;


      element.style.display =
        visibleStops.some(
          item => item.id === stop.id
        )
          ? ""
          : "none";

    });


    setProgress(0);
    moveVehicle(0);
  }


  /*
   * CREAR MAPA
   */

  async function drawMap() {

    const map =
      document.getElementById("map");


    svg =
      createSvgElement("svg", {
        viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
        preserveAspectRatio: "xMidYMid meet",
        "aria-hidden": "true"
      });


    map.replaceChildren(svg);


    /*
     * FONDO
     */

    const background =
      createSvgElement("rect", {
        x: 0,
        y: 0,
        width: WIDTH,
        height: HEIGHT,
        class: "map-background"
      });


    svg.appendChild(background);


    /*
     * MAPA DE EUROPA
     */

    try {

      const response =
        await fetch(
          "/tolosa-granada/assets/map/europe.geojson"
        );


      if (response.ok) {

        const geojson =
          await response.json();

        drawGeoJson(geojson);

      }

    } catch (error) {

      console.warn(
        "No se pudo cargar europe.geojson",
        error
      );

    }


    /*
     * RUTA
     */

    const routeGroup =
      createSvgElement("g", {
        class: "routes"
      });


    routePath =
      createSvgElement("path", {
        class: "travel-route",
        fill: "none"
      });


    progressPath =
      createSvgElement("path", {
        class: "travel-progress",
        fill: "none"
      });


    routeGroup.appendChild(routePath);
    routeGroup.appendChild(progressPath);

    svg.appendChild(routeGroup);


    /*
     * PARADAS
     */

    drawStops();


    /*
     * VEHÍCULO
     */

    createVehicle();


    /*
     * MODO INICIAL
     */

    setMode("direct");


    window.TripMap = {

      ready: true,

      stops,

      roadRoute,

      directRoute,

      setMode,

      setProgress,

      positionAtRouteFraction,

      getRoadStopFraction,

      moveVehicle

    };


    document.dispatchEvent(
      new CustomEvent("trip-map-ready")
    );

  }


  drawMap();

})();
