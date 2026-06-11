import { flagIso } from "@/lib/flags";

/**
 * Bandera de un equipo como IMAGEN (flagcdn.com). Se ve igual en todos los
 * sistemas (Windows incluido). Si el nombre no es un país (ej. "Ganador
 * Grupo A"), muestra un balón ⚽.
 */
export function Flag({
  team,
  className = "",
}: {
  team: string;
  className?: string;
}) {
  const iso = flagIso(team);
  if (!iso) return <span className={className}>⚽</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/${iso}.svg`}
      alt=""
      width={20}
      height={15}
      loading="lazy"
      className={`inline-block h-[0.9em] w-auto rounded-[2px] align-[-0.05em] ${className}`}
    />
  );
}
