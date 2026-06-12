import { SkeletonList } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Cargando el Mundial">
      <SkeletonList rows={5} />
    </div>
  );
}
