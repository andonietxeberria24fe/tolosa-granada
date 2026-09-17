(() => {
  "use strict";

  const memories = {
    tolosa: {
      title: "Tolosa",
      text: "Aquí empieza nuestro viaje. Añade aquí la carta de bienvenida o el recuerdo que quieras compartir.",
      photos: []
    },
    aizkorri: {
      title: "Aizkorri",
      text: "Escribe aquí el recuerdo de esta parada.",
      photos: []
    },
    obanos: {
      title: "Óbanos",
      text: "Escribe aquí el recuerdo de esta parada.",
      photos: []
    },
    oropesa: {
      title: "Oropesa",
      text: "Escribe aquí el recuerdo de esta parada.",
      photos: []
    },
    benidorm: {
      title: "Benidorm",
      text: "Escribe aquí el recuerdo de esta parada.",
      photos: []
    },
    granada: {
      title: "Granada",
      text: "Aquí puedes poner la carta final y las últimas fotos del viaje.",
      photos: []
    }
  };

  const panel = document.getElementById("memory-panel");
  const content = document.getElementById("memory-content");
  const closeButton = document.getElementById("close-memory");

  function openMemory(id) {
    const memory = memories[id];
    if (!memory || !panel || !content) return;

    content.replaceChildren();

    const title = document.createElement("h2");
    title.textContent = memory.title;
    content.appendChild(title);

    const paragraph = document.createElement("p");
    paragraph.textContent = memory.text;
    content.appendChild(paragraph);

    if (memory.photos.length) {
      const gallery = document.createElement("div");
      gallery.className = "memory-photos";

      memory.photos.forEach(src => {
        const image = document.createElement("img");
        image.src = src;
        image.alt = `Recuerdo de ${memory.title}`;
        image.loading = "lazy";
        gallery.appendChild(image);
      });

      content.appendChild(gallery);
    }

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  }

  function closeMemory() {
    if (!panel) return;
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeMemory);
  }

  window.TripGallery = {
    openMemory,
    closeMemory,
    memories
  };
})();
