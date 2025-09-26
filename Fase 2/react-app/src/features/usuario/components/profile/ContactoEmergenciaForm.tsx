import { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { addToast } from "@heroui/toast";
import {
  formatIncompletePhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js/mobile";

import useContactoEmergenciaStore from "@/stores/contacto_emergencia/useContactoEmergenciaStore";
import { useSession } from "@/hooks/useSession";
import axios from "@/services/google/axiosInstance";

const ContactoEmergenciaForm = () => {
  const { contactos, addContacto, setContactos } = useContactoEmergenciaStore();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevo, setNuevo] = useState({
    nombre: "",
    telefono: "",
    parentezco: "",
  });
  const [loading, setLoading] = useState(false);
  const { user: usuarioActual } = useSession();

  // Cargar contactos al inicio
  useEffect(() => {
    const cargarContactos = async () => {
      if (!usuarioActual?.id) return;

      try {
        const response = await axios.get(
          `/proyecto/api/contactos-emergencia/?usuario=${usuarioActual.id}`,
        );

        setContactos(response.data);
        setMostrarFormulario(response.data.length === 0); // mostrar si no tiene ninguno
      } catch (error) {
        console.error("Error al cargar contactos:", error);
        addToast({
          title: "Error al cargar",
          description: "No se pudieron obtener los contactos de emergencia.",
          color: "danger",
        });
      }
    };

    cargarContactos();
  }, [usuarioActual?.id]);

  const validarTelefono = (telefono: string) => {
    const numero = parsePhoneNumberFromString(telefono);

    // Solo aceptar números de Chile
    return numero?.isValid() && numero.country === "CL";
  };

  const handleAdd = async () => {
    const { nombre, telefono, parentezco } = nuevo;

    if (!nombre || !telefono || !parentezco) {
      addToast({
        title: "Faltan campos",
        description: "Todos los campos son obligatorios.",
        color: "warning",
      });

      return;
    }

    if (!usuarioActual?.id) {
      addToast({
        title: "Usuario no autenticado",
        description: "No se puede guardar el contacto.",
        color: "warning",
      });

      return;
    }

    if (!validarTelefono(telefono)) {
      addToast({
        title: "Teléfono inválido",
        description: "Formato internacional requerido, ej: +56912345678",
        color: "warning",
      });

      return;
    }

    try {
      setLoading(true);
      const response = await axios.post("/proyecto/api/contactos-emergencia/", {
        ...nuevo,
        usuario: usuarioActual.id,
      });

      addContacto(response.data);
      setNuevo({ nombre: "", telefono: "", parentezco: "" });
      setMostrarFormulario(false);

      addToast({
        title: "Contacto guardado",
        description: "El contacto se agregó exitosamente.",
        color: "success",
      });
    } catch (error) {
      console.error(error);
      addToast({
        title: "Error al guardar",
        description: "No se pudo guardar el contacto.",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  // Limite máximo
  if (contactos.length >= 3) return null;

  return (
    <div className="space-y-4 mt-4">
      {!mostrarFormulario && (
        <div className="flex justify-end">
          <Button
            color="primary"
            variant="light"
            onClick={() => setMostrarFormulario(true)}
          >
            Agregar nuevo contacto
          </Button>
        </div>
      )}

      {mostrarFormulario && (
        <>
          <h3 className="text-lg font-semibold text-default-700">
            Agregar Contacto de Emergencia
          </h3>

          <Input
            isRequired
            isDisabled={loading}
            label="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          />
          <Input
            isRequired
            inputMode="tel"
            isDisabled={loading}
            label="Teléfono"
            placeholder="+569 1234 5678"
            type="tel"
            value={nuevo.telefono}
            onChange={(e) => {
              const input = e.target.value;

              // 1. Elimina todo lo que no sea dígito o +
              const rawClean = input.replace(/[^\d+]/g, "");

              // 2. Si supera los 12 caracteres, no actualiza
              if (rawClean.length > 12) return;

              // 3. Formatea el número mientras escribe
              const formatted = formatIncompletePhoneNumber(rawClean, "CL");

              setNuevo({ ...nuevo, telefono: formatted });
            }}
          />

          <Input
            isRequired
            isDisabled={loading}
            label="Parentesco"
            value={nuevo.parentezco}
            onChange={(e) => setNuevo({ ...nuevo, parentezco: e.target.value })}
          />

          <div className="flex justify-end gap-2">
            <Button
              isDisabled={loading}
              variant="light"
              onClick={() => setMostrarFormulario(false)}
            >
              Cancelar
            </Button>

            <Button color="primary" isLoading={loading} onClick={handleAdd}>
              Agregar
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactoEmergenciaForm;
