const textarea = document.getElementById('observacion');
const contador = document.getElementById('contador');

textarea.addEventListener('input', function() {
  const longitudTexto = textarea.value.length;
  contador.textContent = longitudTexto;
  
  if (longitudTexto > 100) {
    textarea.value = textarea.value.slice(0, 100);
    contador.textContent = 100;
  }
});



