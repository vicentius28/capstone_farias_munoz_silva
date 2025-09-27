function sweet_bienvenida() {
  Swal.fire({
    title: 'Anuncio',
    text: 'Para poder hacer una solicitud debes avisar a recursos humanos para actualizar sus datos',
    icon: 'info',
    confirmButtonText: 'Entendido'
  });
  // Retornar false para evitar la navegación predeterminada
  return false;
}
function menor_6() {
  Swal.fire({
    title: 'Anuncio',
    text: 'Para poder hacer una solicitud debes tener como mínimo 6 meses de antiguedad',
    icon: 'warning',
    confirmButtonText: 'Entendido'
  });
  // Retornar false para evitar la navegación predeterminada
  return false;
}
