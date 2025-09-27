// ContactCard.tsx
import React from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { Phone, User, Users, Pencil, Trash2, Save, X } from "lucide-react";
import { Input } from "@heroui/input";

type Contacto = {
  id: number;
  nombre: string;
  telefono: string;
  parentezco: string;
};

type Props = {
  contacto: Contacto;
  isEditing: boolean;
  editData?: Partial<Contacto>;
  isProfilePage: boolean;
  onEdit: (id: number) => void;
  onCancel: (id: number) => void;
  onSave: (id: number) => void;
  onDeleteAsk: (id: number) => void;
  onChangeField: (id: number, field: keyof Contacto, value: string) => void;
  formatearTelefono: (t: string) => string;
};

function ContactCardBase({
  contacto,
  isEditing,
  editData,
  isProfilePage,
  onEdit,
  onCancel,
  onSave,
  onDeleteAsk,
  onChangeField,
  formatearTelefono,
}: Props) {
  return (
    <Card className={`transition-all duration-200 ${isEditing ? 'ring-2 ring-primary-200 shadow-lg' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start w-full">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary-50">
              <User className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h4 className="font-semibold text-default-700">
                {isEditing ? editData?.nombre : contacto.nombre}
              </h4>
              <Chip size="sm" variant="flat" color="secondary">
                {isEditing ? editData?.parentezco : contacto.parentezco}
              </Chip>
            </div>
          </div>

          {isProfilePage && !isEditing && (
            <div className="flex gap-1">
              <Button isIconOnly size="sm" variant="light" color="default" onPress={() => onEdit(contacto.id)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <Button isIconOnly size="sm" variant="light" color="danger" onPress={() => onDeleteAsk(contacto.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        {isEditing ? (
          <div className="space-y-4">
            <Input
              label="Nombre completo"
              placeholder="Ej: Juan Pérez"
              variant="bordered"
              startContent={<User className="w-4 h-4 text-default-400" />}
              value={editData?.nombre ?? ""}
              onChange={(e) => onChangeField(contacto.id, "nombre", e.target.value)}
            />

            {/* Ver paso 3: formatear en blur, no en cada pulsación */}
            <Input
              label="Teléfono"
              placeholder="+569 1234 5678"
              variant="bordered"
              inputMode="tel"
              type="tel"
              startContent={<Phone className="w-4 h-4 text-default-400" />}
              value={editData?.telefono ?? ""}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d+]/g, "");
                if (raw.length <= 12) {
                  onChangeField(contacto.id, "telefono", raw); // sin formatear aún
                }
              }}
              onBlur={(e) => {
                onChangeField(contacto.id, "telefono", formatearTelefono(e.target.value));
              }}
            />

            <Input
              label="Parentesco/Relación"
              placeholder="Ej: Padre, Hermana, Amigo"
              variant="bordered"
              startContent={<Users className="w-4 h-4 text-default-400" />}
              value={editData?.parentezco ?? ""}
              onChange={(e) => onChangeField(contacto.id, "parentezco", e.target.value)}
            />

            <Divider />

            <div className="flex gap-2 justify-end">
              <Button size="sm" variant="light" startContent={<X className="w-4 h-4" />} onPress={() => onCancel(contacto.id)}>
                Cancelar
              </Button>
              <Button size="sm" color="primary" startContent={<Save className="w-4 h-4" />} onPress={() => onSave(contacto.id)}>
                Guardar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-default-600">
            <Phone className="w-4 h-4 text-default-400" />
            <span className="font-mono text-sm">
              {formatearTelefono(contacto.telefono?.toString() ?? "")}
            </span>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// React.memo evita renders si props no cambian
export default React.memo(ContactCardBase);
