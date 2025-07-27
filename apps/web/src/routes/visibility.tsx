import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Eye, EyeOff, User, Calendar, Zap } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { trpc, trpcClient } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@pheralb/toast";

export const Route = createFileRoute("/visibility")({
  component: VisibilityPage,
});

function VisibilityItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="w-12 h-6 rounded-full" />
    </div>
  );
}

function VisibilityPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch user's poke relations
  const { data: pokesData, isLoading, error } = useQuery(trpc.getUserPokes.queryOptions());

  // Mutation to toggle visibility
  const toggleVisibilityMutation = useMutation({
    mutationFn: (input: { relationId: string; visible: boolean }) =>
      trpcClient.togglePokeVisibility.mutate(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: trpc.getUserPokes.queryKey() });
      toast.success({ text: "Visibility updated!" });
    },
    onError: () => {
      toast.error({ text: "Failed to update visibility" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
        <div className="flex items-center justify-between p-6">
          <button 
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center align-middle select-none font-sans text-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none transition antialiased relative"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-semibold text-white/90">Visibility Settings</h2>
          <div className="w-10"></div>
        </div>
        <div className="space-y-4 px-6">
          {Array.from({ length: 5 }).map((_, index) => (
            <VisibilityItemSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
        <div className="flex items-center justify-between p-6">
          <button 
            onClick={() => navigate({ to: "/" })}
            className="inline-flex items-center justify-center align-middle select-none font-sans text-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none transition antialiased relative"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-semibold text-white/90">Visibility Settings</h2>
          <div className="w-10"></div>
        </div>
        <div className="text-center py-12 px-6">
          <p className="text-red-400 font-medium">Failed to load poke relations</p>
          <p className="text-sm text-white/60 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!pokesData || pokesData.count === 0) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
        <div className="flex items-center justify-between p-6">
          <button 
            onClick={() => navigate({ to: "/leaderboard" })}
            className="inline-flex items-center justify-center align-middle select-none font-sans text-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none transition antialiased relative"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-xl font-semibold text-white/90">Visibility Settings</h2>
          <div className="w-10"></div>
        </div>
        <div className="text-center py-12 px-6">
          <Eye className="h-12 w-12 mx-auto mb-3 text-white/50" />
          <p className="text-white/80 font-medium">No poke relations yet!</p>
          <p className="text-sm text-white/60 mt-1">Start poking people to manage their visibility</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <button 
          onClick={() => navigate({ to: "/" })}
          className="inline-flex items-center justify-center align-middle select-none font-sans text-center p-2 text-white text-sm font-medium rounded-lg bg-white/2.5 border border-white/50 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 duration-300 before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none transition antialiased relative"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-semibold text-white/90">Visibility Settings</h2>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="mb-4">
          <p className="text-sm text-white/60">
            Control which poke relations appear on the leaderboard
          </p>
        </div>
        
        <div className="space-y-3">
          {pokesData.pokeRelations.map((relation) => (
            <div
              key={relation.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                  {relation.otherUser.image ? (
                    <img
                      src={relation.otherUser.image}
                      alt={relation.otherUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-5 w-5 text-white/70" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/90 truncate">
                    {relation.otherUser.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {formatDistanceToNow(new Date(relation.lastPokeDate), {
                        addSuffix: true
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {relation.count} pokes
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  toggleVisibilityMutation.mutate({
                    relationId: relation.id,
                    visible: !relation.visibleLeaderboard,
                  });
                }}
                disabled={toggleVisibilityMutation.isPending}
                className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 ${
                  relation.visibleLeaderboard
                    ? "bg-green-500/20 text-green-400 border border-green-400/30"
                    : "bg-red-500/20 text-red-400 border border-red-400/30"
                } hover:scale-105`}
              >
                {toggleVisibilityMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : relation.visibleLeaderboard ? (
                  <>
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">Visible</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    <span className="text-xs">Hidden</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 