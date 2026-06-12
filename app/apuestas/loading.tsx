import { SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando apuestas">
      <SkeletonList rows={4} />
    </div>
  );
}
