(() => {

  "use strict";


  /* =====================================================
     RECUERDOS
  ===================================================== */

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


  /* =====================================================
     ELEMENTOS
  ===================================================== */

  const panel =
    document.getElementById(
      "memory-panel"
    );


  const content =
    document.getElementById(
      "memory-content"
    );


  const location =
    document.getElementById(
      "memory-location"
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


  let startY =
    0;


  let startTop =
    0;


  let dragging =
    false;


  /* =====================================================
     ABRIR
  ===================================================== */

  function openMemory(
    id
  ) {

    const memory =
      memories[id];


    if (!memory) {
      return;
    }


    content.replaceChildren();


    location.textContent =
      memory.title;


    /*
     * TÍTULO
     */

    const title =
      document.createElement(
        "h2"
      );


    title.textContent =
      memory.title;


    content.appendChild(
      title
    );


    /*
     * TEXTO
     */

    const paragraph =
      document.createElement(
        "p"
      );


    paragraph.textContent =
      memory.text;


    content.appendChild(
      paragraph
    );


    /*
     * FOTOS
     */

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


    /*
     * Abrir
     */

    panel.classList.add(
      "open"
    );


    panel.classList.remove(
      "expanded"
    );


    panel.setAttribute(
      "aria-hidden",
      "false"
    );


    /*
     * Posición inicial:
     * cajón grande pero no completo.
     */

    panel.style.transform =
      "translateX(-50%) translateY(18%)";

  }


  /* =====================================================
     EXPANDIR
  ===================================================== */

  function expandMemory() {

    panel.classList.add(
      "expanded"
    );


    panel.style.transform =
      "translateX(-50%) translateY(0)";

  }


  /* =====================================================
     CERRAR
  ===================================================== */

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


    /*
     * Avisamos a app.js
     * para que vuelvan los botones.
     */

    document.dispatchEvent(
      new CustomEvent(
        "memory-closed"
      )
    );

  }


  /* =====================================================
     BOTÓN AMPLIAR
  ===================================================== */

  expandButton.addEventListener(
    "click",
    expandMemory
  );


  /* =====================================================
     BOTÓN X
  ===================================================== */

  closeButton.addEventListener(
    "click",
    closeMemory
  );


  /* =====================================================
     ARRASTRAR CAJÓN
  ===================================================== */

  grabber.addEventListener(
    "pointerdown",
    event => {

      if (
        !panel.classList.contains(
          "open"
        )
      ) {
        return;
      }


      dragging =
        true;


      startY =
        event.clientY;


      startTop =
        panel.getBoundingClientRect()
          .top;


      panel.style.transition =
        "none";


      grabber.setPointerCapture(
        event.pointerId
      );

    }
  );


  grabber.addEventListener(
    "pointermove",
    event => {

      if (!dragging) {
        return;
      }


      const delta =
        event.clientY -
        startY;


      let next =
        startTop +
        delta;


      const minTop =
        0;


      const maxTop =
        window.innerHeight *
        0.45;


      next =
        Math.max(
          minTop,
          Math.min(
            maxTop,
            next
          )
        );


      panel.style.transform =
        `translateX(-50%) translateY(${next}px)`;

    }
  );


  function finishDrag() {

    if (!dragging) {
      return;
    }


    dragging =
      false;


    panel.style.transition =
      "";


    const top =
      panel.getBoundingClientRect()
        .top;


    if (
      top <
      window.innerHeight * 0.20
    ) {

      expandMemory();

    } else {

      panel.style.transform =
        "translateX(-50%) translateY(18%)";

    }

  }


  grabber.addEventListener(
    "pointerup",
    finishDrag
  );


  grabber.addEventListener(
    "pointercancel",
    finishDrag
  );


  /* =====================================================
     EXPORTAR
  ===================================================== */

  window.TripGallery = {

    openMemory,

    closeMemory,

    expandMemory,

    memories

  };

})();
