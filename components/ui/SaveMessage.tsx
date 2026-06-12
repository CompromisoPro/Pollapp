/**
 * Mensaje de feedback tras guardar. Verde si éxito (empieza con "✓"), rojo si error.
 * Antes esta lógica estaba duplicada idéntica en MatchCard y BonusCard.
 */
export default function SaveMessage({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <p
      className={`mt-2 text-xs ${
        msg.startsWith("✓") ? "text-green-600" : "text-red-600"
      }`}
    >
      {msg}
    </p>
  );
}
