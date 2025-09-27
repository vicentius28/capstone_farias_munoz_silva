const carousel = document.querySelector(".carousel");
const arrowBtns = document.querySelectorAll(".wrapper i");
const firstCardWidth = carousel.querySelector(".card").offsetWidth;
let isDragging = false,
  startX,
  startScrollLeft;

let cardPerView = Math.round(carousel.offsetWidth / firstCardWidth);

// Obtener todos los elementos iniciales
const carouselChildren = [...carousel.children];

// Duplicar los elementos visibles al inicio y al final
carouselChildren
  .slice(-cardPerView)
  .reverse()
  .forEach((card) => {
    carousel.insertAdjacentHTML("afterbegin", card.outerHTML);
  });

carouselChildren.slice(0, cardPerView).forEach((card) => {
  carousel.insertAdjacentHTML("beforeend", card.outerHTML);
});

// Ajustar el desplazamiento inicial
carousel.scrollLeft = carousel.offsetWidth;

// Función de desplazamiento infinito
const infiniteScroll = () => {
  if (carousel.scrollLeft === 0) {
    // Si llega al inicio, saltar al final duplicado
    carousel.classList.add("no-transition");
    carousel.scrollLeft = carousel.scrollWidth - 2 * carousel.offsetWidth;
    carousel.classList.remove("no-transition");
  } else if (
    Math.ceil(carousel.scrollLeft) ===
    carousel.scrollWidth - carousel.offsetWidth
  ) {
    // Si llega al final, saltar al inicio duplicado
    carousel.classList.add("no-transition");
    carousel.scrollLeft = carousel.offsetWidth;
    carousel.classList.remove("no-transition");
  }
};

// Evento de clic para los botones de flecha
arrowBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    carousel.scrollLeft += btn.id === "left" ? -firstCardWidth : firstCardWidth;

    // Verificar si es necesario ajustar la posición después de un clic
    setTimeout(infiniteScroll, 50); // Ajustar tras un pequeño retraso para evitar inconsistencias
  });
});

// Funciones para arrastrar el carrusel
const dragStart = (e) => {
  isDragging = true;
  carousel.classList.add("dragging");
  startX = e.pageX || e.touches?.[0]?.pageX;
  startScrollLeft = carousel.scrollLeft;
};

const dragging = (e) => {
  if (!isDragging) return;
  const x = e.pageX || e.touches?.[0]?.pageX;
  const dragDistance = x - startX;
  carousel.scrollLeft = startScrollLeft - dragDistance;
};

const dragStop = () => {
  isDragging = false;
  carousel.classList.remove("dragging");
};

// Agregar evento de scroll
carousel.addEventListener("scroll", infiniteScroll);

// Eventos para arrastre (soporte táctil y mouse)
carousel.addEventListener("mousedown", dragStart);
carousel.addEventListener("mousemove", dragging);
document.addEventListener("mouseup", dragStop);

carousel.addEventListener("touchstart", dragStart); // Soporte táctil
carousel.addEventListener("touchmove", dragging);
document.addEventListener("touchend", dragStop);
