(() => {
  "use strict";


  const memories = {

    tolosa: {

      title: "Tolosa",

      text:
        "Aquí empieza nuestro viaje. Añade aquí la carta de bienvenida o el recuerdo que quieras compartir.",

      photos: []

    },


    aizkorri: {

      title: "Aizkorri",

      text:
        "Escribe aquí el recuerdo de esta parada.",

      photos: []

    },


    obanos: {

      title: "Óbanos",

      text:
        "Escribe aquí el recuerdo de esta parada.",

      photos: []

    },


    oropesa: {

      title: "Oropesa",

      text:
        "Escribe aquí el recuerdo de esta parada.",

      photos: []

    },


    benidorm: {

      title: "Benidorm",

      text:
        "Escribe aquí el recuerdo de esta parada.",

      photos: []

    },


    granada: {

      title: "Granada",

      text:
        "Aquí puedes poner la carta final y las últimas fotos del viaje.",

      photos: []

    }

  };


  const panel =
    document.getElementById(
      "memory-panel"
    );


  const content =
    document.getElementById(
      "memory-content"
    );


  const grabber =
    document.getElementById(
      "memory-grabber"
    );


  const expandButton =
    document.getElementById(
      "expand-memory"
    );


  const closeButton =
    document.getElementById(
      "close-memory"
    );


  let startY = 0;

  let startTranslate = 0;

  let dragging = false;


  /*
   * ALTURAS
   */

  function getCollapsedY() {

    return Math.min(
      430,
      window.innerHeight * 0.58
    );

  }


  function getExpandedY() {

    return 30;

  }


  /*
   * APLICAR POSICIÓN
   */

  function setDrawerPosition(
    y,
    animate = true
  ) {

    panel.style.transition =
      animate
        ? ""
        : "none";


    panel.style.transform =
      `translateX(-50%) translateY(${y}px)`;

  }


  /*
   * ABRIR
   */

  function openMemory(id) {

    const memory =
      memories[id];


    if (!memory) {
      return;
    }


    content.replaceChildren();


    const title =
      document.createElement(
        "h2"
      );


    title.textContent =
      memory.title;


    content.appendChild(
      title
    );


    const paragraph =
      document.createElement(
        "p"
      );


    paragraph.textContent =
      memory.text;


    content.appendChild(
      paragraph
    );


    if (
      memory.photos.length
    ) {

      const gallery =
        document.createElement(
          "div"
        );


      gallery.className =
        "memory-photos";


      memory.photos.forEach(
        src => {

          const image =
            document.createElement(
              "img"
            );


          image.src =
            src;


          image.alt =
            `Recuerdo de ${memory.title}`;


          image.loading =
            "lazy";


          gallery.appendChild(
            image
          );

        }
      );


      content.appendChild(
        gallery
      );

    }


    panel.classList.add(
      "open"
    );


    panel.setAttribute(
      "aria-hidden",
      "false"
    );


    /*
     * Arranca como cajón medio abierto.
     */

    requestAnimationFrame(
      () => {

        setDrawerPosition(
          getCollapsedY(),
          true
        );

      }
    );

  }


  /*
   * SUBIR COMPLETAMENTE
   */

  function expandMemory() {

    setDrawerPosition(
      getExpandedY(),
      true
    );

    panel.classList.add(
      "expanded"
    );

  }


  /*
   * CERRAR
   */

  function closeMemory() {

    panel.classList.remove(
      "open",
      "expanded"
    );


    panel.setAttribute(
      "aria-hidden",
      "true"
    );


    panel.style.transform =
      "";

  }


  /*
   * BOTÓN SUBIR
   */

  expandButton.addEventListener(
    "click",
    () => {

      expandMemory();

    }
  );


  /*
   * CERRAR
   */

  closeButton.addEventListener(
    "click",
    () => {

      closeMemory();

    }
  );


  /*
   * TOUCH / RATÓN
   */

  function pointerDown(event) {

    if (
      !panel.classList.contains(
        "open"
      )
    ) {

      return;

    }


    dragging = true;


    startY =
      event.clientY;


    const current =
      panel
        .getBoundingClientRect()
        .top;


    startTranslate =
      current;


    panel.style.transition =
      "none";


    grabber.setPointerCapture?.(
      event.pointerId
    );

  }


  function pointerMove(event) {

    if (!dragging) {
      return;
    }


    const delta =
      event.clientY -
      startY;


    let next =
      startTranslate +
      delta;


    const min =
      getExpandedY();


    const max =
      getCollapsedY();


    next =
      Math.max(
        min,
        Math.min(
          max,
          next
        )
      );


    panel.style.transform =
      `translateX(-50%) translateY(${next}px)`;

  }


  function pointerUp() {

    if (!dragging) {
      return;
    }


    dragging = false;


    const top =
      panel
        .getBoundingClientRect()
        .top;


    const middle =
      (
        getExpandedY() +
        getCollapsedY()
      ) / 2;


    if (
      top < middle
    ) {

      expandMemory();

    } else {

      setDrawerPosition(
        getCollapsedY(),
        true
      );

    }

  }


  grabber.addEventListener(
    "pointerdown",
    pointerDown
  );


  grabber.addEventListener(
    "pointermove",
    pointerMove
  );


  grabber.addEventListener(
    "pointerup",
    pointerUp
  );


  grabber.addEventListener(
    "pointercancel",
    pointerUp
  );


  /*
   * EXPORTAR
   */

  window.TripGallery = {

    openMemory,

    closeMemory,

    expandMemory,

    memories

  };

})();
