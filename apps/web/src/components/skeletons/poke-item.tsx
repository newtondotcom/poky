import { Skeleton } from "@/components/ui/skeleton";

export function PokeItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      </div>
      <div className="text-right space-y-2">
        <div className="flex items-center gap-2 justify-end">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-6" />
        </div>
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
