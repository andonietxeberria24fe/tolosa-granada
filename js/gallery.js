(() => {
  "use strict";

  const memories = {
    tolosa: {
      title: "Tolosa",
      emoji: "🏠",
      subtitle: "Aquí empieza todo",

      description:
        "El punto de partida. Antes de poner rumbo al sur todavía quedaba carretera, risas y un montón de historias por delante.",

      memoryText:
        "Aquí puedes colocar la carta de bienvenida, una foto de la salida o ese primer recuerdo que quieras que aparezca al empezar el viaje.",

      photos: []
    },

    aizkorri: {
      title: "Aizkorri",
      emoji: "⛰️",
      subtitle: "Primera parada",

      description:
        "Una primera pausa en nuestro camino, entre montañas y aire de casa. El viaje ya ha empezado de verdad.",

      memoryText:
        "Añade aquí las fotos y la pequeña historia de esta parada.",

      photos: []
    },

    obanos: {
      title: "Óbanos",
      emoji: "🌿",
      subtitle: "Seguimos bajando",

      description:
        "Otra parada en el camino para descansar un poco, disfrutar del momento y seguir acumulando kilómetros y recuerdos.",

      memoryText:
        "Añade aquí las fotos y anécdotas de Óbanos.",

      photos: []
    },

    oropesa: {
      title: "Oropesa",
      emoji: "🌊",
      subtitle: "Ya huele a Mediterráneo",

      description:
        "Aquí cambia el paisaje y el viaje se empieza a sentir diferente: más luz, más mar y la sensación de que todavía queda mucho por vivir.",

      memoryText:
        "Añade aquí las fotos y recuerdos de Oropesa.",

      photos: []
    },

    benidorm: {
      title: "Benidorm",
      emoji: "☀️",
      subtitle: "Parada con sol",

      description:
        "Una de esas paradas que se recuerdan por el ambiente, las bromas y todo lo que acaba pasando cuando viajas con amigos.",

      memoryText:
        "Añade aquí las fotos, vídeos o anécdotas de Benidorm.",

      photos: []
    },

    granada: {
      title: "Granada",
      emoji: "🏰",
      subtitle: "Hemos llegado",

      description:
        "Última parada. Después de tantos kilómetros, toca disfrutar de Granada y guardar en la memoria todo lo que ha pasado por el camino.",

      memoryText:
        "Aquí puedes colocar la carta final, las últimas fotos y cualquier mensaje de despedida.",

      photos: []
    }
  };

  const backdrop =
    document.getElementById(
      "arrival-backdrop"
    );

  const modal =
    document.getElementById(
      "arrival-modal"
    );

  const kicker =
    document.getElementById(
      "arrival-kicker"
    );

  const view =
    document.getElementById(
      "arrival-view"
    );

  const arrivalActions =
    document.getElementById(
      "arrival-actions"
    );

  const memoryActions =
    document.getElementById(
      "memory-actions"
    );

  const closeButton =
    document.getElementById(
      "close-arrival"
    );

  const continueButton =
    document.getElementById(
      "arrival-continue"
    );

  const memoryButton =
    document.getElementById(
      "arrival-memory"
    );

  const backButton =
    document.getElementById(
      "memory-back"
    );

  let currentId = null;
  let currentContinueHandler =
    null;

  function setOpen(open) {
    backdrop.classList.toggle(
      "open",
      open
    );

    backdrop.setAttribute(
      "aria-hidden",
      String(!open)
    );

    document.body.classList.toggle(
      "modal-open",
      open
    );
  }

  function renderArrival(
    memory
  ) {
    kicker.textContent =
      "HAS LLEGADO";

    view.replaceChildren();

    const hero =
      document.createElement(
        "div"
      );

    hero.className =
      "arrival-hero";

    const emoji =
      document.createElement(
        "div"
      );

    emoji.className =
      "stop-emoji";

    emoji.textContent =
      memory.emoji;

    const title =
      document.createElement(
        "h2"
      );

    title.id =
      "arrival-title";

    title.textContent =
      memory.title;

    const subtitle =
      document.createElement(
        "p"
      );

    subtitle.className =
      "arrival-subtitle";

    subtitle.textContent =
      memory.subtitle;

    const description =
      document.createElement(
        "p"
      );

    description.className =
      "arrival-description";

    description.textContent =
      memory.description;

    const chip =
      document.createElement(
        "div"
      );

    chip.className =
      "route-chip";

    chip.innerHTML =
      `
        <span>📍</span>
        <span>
          Parada guardada en el viaje
        </span>
      `;

    hero.append(
      emoji,
      title,
      subtitle,
      description,
      chip
    );

    view.appendChild(
      hero
    );

    arrivalActions.hidden =
      false;

    memoryActions.hidden =
      true;
  }

  function renderMemory(
    memory
  ) {
    kicker.textContent =
      "UN RECUERDO DEL VIAJE";

    view.replaceChildren();

    const heading =
      document.createElement(
        "div"
      );

    heading.className =
      "memory-heading";

    const memoryKicker =
      document.createElement(
        "div"
      );

    memoryKicker.className =
      "eyebrow memory-kicker";

    memoryKicker.textContent =
      `${memory.emoji} RECUERDOS`;

    const title =
      document.createElement(
        "h2"
      );

    title.id =
      "arrival-title";

    title.textContent =
      memory.title;

    const subtitle =
      document.createElement(
        "p"
      );

    subtitle.textContent =
      memory.subtitle;

    const copy =
      document.createElement(
        "p"
      );

    copy.className =
      "memory-copy";

    copy.textContent =
      memory.memoryText;

    heading.append(
      memoryKicker,
      title,
      subtitle,
      copy
    );

    view.appendChild(
      heading
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
        (src, index) => {
          const image =
            document.createElement(
              "img"
            );

          image.className =
            "memory-photo";

          image.src = src;

          image.alt =
            `Recuerdo ${index + 1} de ${memory.title}`;

          image.loading =
            "lazy";

          gallery.appendChild(
            image
          );
        }
      );

      view.appendChild(
        gallery
      );
    } else {
      const empty =
        document.createElement(
          "div"
        );

      empty.className =
        "memory-empty";

      empty.textContent =
        "📸 Todavía no has añadido fotos a esta parada. Este hueco queda preparado para ellas.";

      view.appendChild(
        empty
      );
    }

    arrivalActions.hidden =
      true;

    memoryActions.hidden =
      false;
  }

  function openArrival(
    id,
    onContinue
  ) {
    const memory =
      memories[id];

    if (!memory) return;

    currentId = id;

    currentContinueHandler =
      typeof onContinue ===
      "function"
        ? onContinue
        : null;

    renderArrival(
      memory
    );

    setOpen(true);
  }

  function openMemory(
    id = currentId
  ) {
    const memory =
      memories[id];

    if (!memory) return;

    currentId = id;

    renderMemory(
      memory
    );

    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  continueButton.addEventListener(
    "click",
    () => {
      const callback =
        currentContinueHandler;

      if (
        typeof callback ===
        "function"
      ) {
        callback();
      }
    }
  );

  memoryButton.addEventListener(
    "click",
    () => {
      openMemory();
    }
  );

  backButton.addEventListener(
    "click",
    () => {
      const memory =
        memories[currentId];

      if (memory) {
        renderArrival(
          memory
        );
      }
    }
  );

  closeButton.addEventListener(
    "click",
    close
  );

  backdrop.addEventListener(
    "click",
    event => {
      if (
        event.target ===
        backdrop
      ) {
        close();
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
          "Escape" &&
        backdrop.classList.contains(
          "open"
        )
      ) {
        close();
      }
    }
  );

  window.TripGallery = {
    memories,
    openArrival,
    openMemory,
    close,

    closeMemory:
      close,

    isOpen:
      () =>
        backdrop.classList.contains(
          "open"
        )
  };
})();
