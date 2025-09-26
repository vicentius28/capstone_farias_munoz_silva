let lastScrollTop = 0;
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', function() {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (scrollTop > lastScrollTop) {
    // Scroll hacia abajo - esconder navbar
    navbar.style.top = '-200px';
  } else {
    // Scroll hacia arriba - mostrar navbar
    navbar.style.top = '0';
  }
  lastScrollTop = scrollTop;
});
