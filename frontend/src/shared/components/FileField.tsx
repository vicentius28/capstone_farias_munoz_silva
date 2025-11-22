import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

function FileField({
  id,
  label,
  accept,
  onChange,
  file,
}: {
  id: string;
  label: string;
  accept?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium" htmlFor={id}>
        {label}
      </label>
      <div className="flex items-center gap-3">
        <Input
          accept={accept}
          className="hidden"
          id={id}
          type="file"
          onChange={onChange}
        />
        <Button as="label" htmlFor={id} variant="flat">
          Seleccionar archivo
        </Button>
        <span className="text-default-500">
          {file?.name ?? "Ningún archivo seleccionado"}
        </span>
      </div>
    </div>
  );
}

export default FileField;
