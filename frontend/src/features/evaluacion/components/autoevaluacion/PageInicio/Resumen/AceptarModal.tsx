import { Button } from "@heroui/button";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function AceptarModal({
  open,
  onClose,
  onConfirm,
  loading,
}: Props) {
  return (
    <Modal
      hideCloseButton
      backdrop="blur"
      isDismissable={false}
      isOpen={open}
      size="md"
      onOpenChange={(isOpen) => (isOpen ? undefined : onClose())}
    >
      <ModalContent>
        <ModalHeader className="text-lg font-semibold">
          Confirmar firma de evaluación
        </ModalHeader>
        <ModalBody>
          <p className="text-default-700">
            ¿Confirmas que deseas aceptar y firmar esta evaluación?
          </p>
          <p className="text-xs text-default-500">
            Esta acción registrará tu firma. Si necesitas dejar una observación,
            usa “Firmar con Observaciones”.
          </p>
        </ModalBody>
        <ModalFooter>
          <Button isDisabled={!!loading} variant="flat" onPress={onClose}>
            Cancelar
          </Button>
          <Button
            className="rounded-xl bg-success text-success-foreground"
            isLoading={!!loading}
            onPress={onConfirm}
          >
            Confirmar firma
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
