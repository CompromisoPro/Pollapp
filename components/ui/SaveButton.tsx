/**
 * Botón de guardado coherente para toda la app (apuestas, bonos, admin).
 * Unifica los tres labels que antes se repetían inline en cada card:
 * "Guardar" / "Actualizar" / "Guardando…".
 */
export default function SaveButton({
  pending,
  isEditing,
  onClick,
}: {
  pending: boolean;
  /** true si ya existe una respuesta previa (muestra "Actualizar" en vez de "Guardar"). */
  isEditing: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="btn btn-primary px-3 py-1.5 text-xs"
    >
      {pending ? "Guardando…" : isEditing ? "Actualizar" : "Guardar"}
    </button>
  );
}
