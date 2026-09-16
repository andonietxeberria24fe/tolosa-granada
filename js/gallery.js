(() => {
  const memories = [
    {
      title: "Tolosa",
      text: [
        "Aquí empieza nuestro viaje.",
        "En este espacio pondremos el primer recuerdo, una pequeña carta o una foto."
      ],
      images: []
    },
    {
      title: "Alegui",
      text: [
        "Primer recuerdo del camino.",
        "Aquí puedes escribir qué pasó, qué te hizo gracia o qué quieres que recuerde."
      ],
      images: []
    },
    {
      title: "Aizkorri",
      text: [
        "Un lugar especial para nosotras.",
        "Aquí podemos poner una anécdota de la montaña, una carta o una foto."
      ],
      images: []
    },
    {
      title: "Óbanos",
      text: [
        "Otra parada de nuestro recorrido.",
        "Este texto es provisional: después lo sustituiremos por tu recuerdo."
      ],
      images: []
    },
    {
      title: "Oropesa",
      text: [
        "Aquí empieza otra parte del viaje.",
        "Añadiremos aquí las palabras y las imágenes que quieras."
      ],
      images: []
    },
    {
      title: "Benidorm",
      text: [
        "Una parada más antes de llegar.",
        "Puedes poner una historia, una foto o una frase que tenga significado para vosotras."
      ],
      images: []
    },
    {
      title: "Granada",
      text: [
        "Llegamos al destino.",
        "Aquí podemos guardar el mensaje final, una carta más larga o una foto especial."
      ],
      images: []
    }
  ];

  function openMemory(index) {
    const memory = memories[index];
    if (!memory) return;

    const panel = document.getElementById("memory-panel");
    const title = document.getElementById("memory-title");
    const content = document.getElementById("memory-content");

    title.textContent = memory.title;
    content.replaceChildren();

    memory.text.forEach(paragraphText => {
      const paragraph = document.createElement("p");
      paragraph.textContent = paragraphText;
      content.appendChild(paragraph);
    });

    memory.images.forEach(imagePath => {
      const image = document.createElement("img");
      image.src = imagePath;
      image.alt = `Recuerdo de ${memory.title}`;
      content.appendChild(image);
    });

    panel.hidden = false;
  }

  function closeMemory() {
    document.getElementById("memory-panel").hidden = true;
  }

  window.TripGallery = {
    openMemory,
    closeMemory
  };
})();
