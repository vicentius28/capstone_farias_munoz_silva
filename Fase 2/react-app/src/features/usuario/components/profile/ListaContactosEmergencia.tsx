import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom"; // Agregar este import
import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import {
  Phone,
  AlertTriangle,
  UserPlus,
  Trash2
} from "lucide-react";
import { formatIncompletePhoneNumber } from "libphonenumber-js/min";
import { parsePhoneNumberFromString } from "libphonenumber-js/min";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { addToast } from "@heroui/toast";

import axios from "@/services/google/axiosInstance";
import useContactoEmergenciaStore from "@/stores/contacto_emergencia/useContactoEmergenciaStore";
import { useSession } from "@/hooks/useSession";
import ContactCard from "./ContactCard";

type Contacto = {
  id: number;
  nombre: string;
  telefono: string;
  parentezco: string;
};

interface ListaContactosEmergenciaProps {
  userId?: number; // ID del usuario cuyos contactos queremos ver
}

const ListaContactosEmergencia: React.FC<ListaContactosEmergenciaProps> = ({ userId }) => {
  const location = useLocation(); // Agregar este hook
  const { contactos, setContactos, updateContacto, removeContacto } =
    useContactoEmergenciaStore();
  const { user: usuarioActual } = useSession();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [editado, setEditado] = useState<{ [key: number]: Partial<Contacto> }>({});
  const [confirmarEliminarId, setConfirmarEliminarId] = useState<number | null>(
    null,
  );

  // Determinar qué usuario usar: el pasado como prop o el usuario actual
  const targetUserId = userId || usuarioActual?.id;
  const isProfilePage = location.pathname === "/perfil";

  const formatearTelefono = (telefono: string): string => {
    const numero = parsePhoneNumberFromString(telefono);
    return numero ? numero.formatInternational() : telefono;
  };

  const handleCancelarEdicion = (id: number) => {
    setEditado((prev) => {
      const actualizado = { ...prev };
      delete actualizado[id];
      return actualizado;
    });
    setEditandoId(null);
  };

  useEffect(() => {
    const cargarContactos = async () => {
      if (!targetUserId) return;

      try {
        const response = await axios.get(
          `/proyecto/api/contactos-emergencia/?usuario=${targetUserId}`,
        );
        setContactos(response.data);
      } catch (error) {
        console.error("Error al cargar contactos:", error);
        addToast({
          title: "Error",
          description: "No se pudieron cargar los contactos.",
          color: "danger",
        });
      }
    };

    cargarContactos();
  }, [targetUserId, setContactos]);

  const handleEdit = (id: number) => {
    const contacto = contactos.find(c => c.id === id);
    if (!contacto) return;

    setEditandoId(id);
    const telefonoFormateado = formatIncompletePhoneNumber(
      contacto.telefono,
      "CL",
    );

    setEditado((prev) => ({
      ...prev,
      [id]: {
        ...contacto,
        telefono: telefonoFormateado,
      },
    }));
  };

  const handleGuardar = async (id: number) => {
    const payload = editado[id];
    if (!payload) return;

    const numero = parsePhoneNumberFromString(payload.telefono || "", "CL");

    if (!numero?.isValid()) {
      addToast({
        title: "Teléfono inválido",
        description:
          "Debes ingresar un número válido en formato internacional, ej: +569 6316 9493.",
        color: "warning",
      });
      return;
    }

    try {
      const payloadFinal = {
        ...payload,
        telefono: numero.number,
      };

      await axios.put(
        `/proyecto/api/contactos-emergencia/${id}/`,
        payloadFinal,
      );
      updateContacto(id, payloadFinal);
      setEditandoId(null);

      // Limpiar datos de edición
      setEditado((prev) => {
        const actualizado = { ...prev };
        delete actualizado[id];
        return actualizado;
      });

      addToast({
        title: "Contacto actualizado",
        description: "Los cambios fueron guardados exitosamente.",
        color: "success",
      });
    } catch (err) {
      console.error("Error actualizando contacto:", err);
      addToast({
        title: "Error al actualizar",
        description: "No se pudo guardar el contacto.",
        color: "danger",
      });
    }
  };

  const handleEliminar = async (id: number) => {
    try {
      await axios.delete(`/proyecto/api/contactos-emergencia/${id}/`);
      removeContacto(id);
      setConfirmarEliminarId(null);
      addToast({
        title: "Contacto eliminado",
        description: "El contacto fue eliminado correctamente.",
        color: "success",
      });
    } catch (err) {
      console.error("Error eliminando contacto:", err);
      addToast({
        title: "Error al eliminar",
        description: "No se pudo eliminar el contacto.",
        color: "danger",
      });
    }
  };

  const handleChangeField = (id: number, field: keyof Contacto, value: string) => {
    setEditado((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const EmptyState = () => (
    <Card className="border-dashed border-2 border-default-200">
      <CardBody className="py-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-default-100">
            <UserPlus className="w-8 h-8 text-default-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-default-600">
              No hay contactos de emergencia
            </h3>
            <p className="text-sm text-default-400 max-w-xs">
              Agrega contactos de confianza para situaciones de emergencia
            </p>
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      {contactos.length > 0 && (
        <div className=" gap-4 pb-2">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/30">
              <Phone className="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Contactos de Emergencia
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Información para situaciones de urgencia
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de contactos */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {contactos.length === 0 ? (
          <div className="col-span-full">
            <EmptyState />
          </div>
        ) : (
          contactos.map((contacto) => (
            <ContactCard
              key={contacto.id}
              contacto={contacto}
              isEditing={editandoId === contacto.id}
              editData={editado[contacto.id]}
              isProfilePage={isProfilePage}
              onEdit={handleEdit}
              onCancel={handleCancelarEdicion}
              onSave={handleGuardar}
              onDeleteAsk={setConfirmarEliminarId}
              onChangeField={handleChangeField}
              formatearTelefono={formatearTelefono}
            />
          ))
        )}
      </div>
      <Chip size="sm" variant="flat" color="primary" className="justify-end">
        {contactos.length} {contactos.length === 1 ? 'contacto' : 'contactos'}
      </Chip>

      {/* Modal de confirmación */}
      <Modal
        isOpen={confirmarEliminarId !== null}
        onOpenChange={() => setConfirmarEliminarId(null)}
        backdrop="blur"
        classNames={{
          base: "border border-danger-200",
          header: "border-b border-danger-200",
          body: "py-6",
          footer: "border-t border-danger-200"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-danger-50">
              <AlertTriangle className="w-5 h-5 text-danger-500" />
            </div>
            <span>¿Eliminar contacto de emergencia?</span>
          </ModalHeader>
          <ModalBody>
            <p className="text-default-600">
              Esta acción no se puede deshacer. El contacto será eliminado
              permanentemente de tu lista de emergencia.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setConfirmarEliminarId(null)}
            >
              Cancelar
            </Button>
            <Button
              color="danger"
              startContent={<Trash2 className="w-4 h-4" />}
              onPress={() =>
                confirmarEliminarId && handleEliminar(confirmarEliminarId)
              }
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default ListaContactosEmergencia;