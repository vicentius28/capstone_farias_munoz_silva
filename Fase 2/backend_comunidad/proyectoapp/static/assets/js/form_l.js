document.addEventListener("DOMContentLoaded", function () {
  const idInput = document.getElementById("id");
  const rutInput = document.getElementById("rut");
  const nombreInput = document.getElementById("nombre");
  const cicloInput = document.getElementById("ciclo");
  const codigoInput = document.getElementById("codigo");
  const jornadaSelect = document.getElementById("jornada");
  const tipoSelect = document.getElementById("tipo_l");

  function clearFields() {
    nombreInput.value = "";
    cicloInput.value = "";
    codigoInput.value = "";
    jornadaSelect.value = "";
    tipoSelect.value = "";
  }

  function cargarOpciones() {
    fetch("/licencia/api/opciones/")
      .then((response) => response.json())
      .then((data) => {
        // Limpia las opciones existentes
        clearFields();

        // Añade nuevas opciones de jornada
        data.jornadas.forEach((jornada) => {
          const option = document.createElement("option");
          option.value = jornada.id;
          option.textContent = jornada.jornada;
          jornadaSelect.appendChild(option);
        });

        // Añade nuevas opciones de tipo de licencia
        data.tipos_licencia.forEach((tipo) => {
          const option = document.createElement("option");
          option.value = tipo.id;
          option.textContent = tipo.tipo;
          tipoSelect.appendChild(option);
        });
      })
      .catch((error) => console.error("Error cargando opciones:", error));
  }

  $("#rut").autocomplete({
    source: function (request, response) {
      $.ajax({
        url: "/licencia/api/trabajador/",
        data: { rut: request.term },
        success: function (data) {
          response(
            data.map(function (item) {
              return { label: item.rut, value: item.rut };
            })
          );
        },
      });
    },
    minLength: 3,
    select: function (event, ui) {
      fetch(`/licencia/api/trabajador/?rut=${ui.item.value}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            clearFields();
          } else {
            const trabajador = data[0]; // Asumiendo que la respuesta es una lista con un solo objeto
            idInput.value = trabajador.id;
            nombreInput.value = trabajador.nombre;
            cicloInput.value = trabajador.ciclo;
            codigoInput.value = trabajador.codigo;
          }
        })
        .catch((error) => {
          console.error("Error fetching trabajador data:", error);
          clearFields();
        });
    },
  });

  rutInput.addEventListener("input", function () {
    if (rutInput.value.length < 4) {
      clearFields();
    }
  });

  // Cargar las opciones de jornada y tipo de licencia al cargar la página
  cargarOpciones();
});

document.addEventListener("DOMContentLoaded", function () {
  const diasInput = document.getElementById("dias");
  const diaIniInput = document.getElementById("dia_ini");
  const diaTerInput = document.getElementById("dia_ter");

  function actualizarDiaTermino() {
    const dias = parseInt(diasInput.value, 10);
    const diaIniStr = diaIniInput.value;

    // Imprimir el valor de la fecha de inicio como cadena
    console.log("Fecha de inicio como cadena:", diaIniStr);

    // Convertir la cadena a un objeto de fecha en UTC sin la zona horaria
    const diaIni = new Date(diaIniStr + "T00:00:00");

    // Imprimir el objeto de fecha en UTC
    console.log("Fecha de inicio como objeto Date en UTC:", diaIni);

    if (dias && !isNaN(diaIni.getTime())) {
      // Crear una nueva fecha a partir de la fecha de inicio
      const diaTer = new Date(diaIni);

      // Ajustar la fecha en UTC y restar un día para obtener el último día correcto
      diaTer.setUTCDate(diaIni.getUTCDate() + dias - 1);

      // Imprimir la fecha final calculada en UTC
      console.log("Fecha hasta calculada en UTC:", diaTer);

      // Asegúrate de que la fecha esté en formato YYYY-MM-DD
      const diaTerFormatted = diaTer.toISOString().split("T")[0];
      diaTerInput.value = diaTerFormatted;

      console.log("Fecha hasta formateada:", diaTerFormatted);
    } else {
      diaTerInput.value = "";
    }
  }

  diasInput.addEventListener("input", actualizarDiaTermino);
  diaIniInput.addEventListener("change", actualizarDiaTermino);

  // Asegúrate de ajustar la fecha antes de enviar el formulario
  document
    .getElementById("miFormulario")
    .addEventListener("submit", function () {
      // Ajustar la fecha hasta antes de enviar
      actualizarDiaTermino();
    });
});
