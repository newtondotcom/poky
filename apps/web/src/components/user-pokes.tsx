import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar, Zap, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePokeData, useOrderedPokeRelations } from "@/stores/poke-store";
import { formatDistanceToNow } from "date-fns";
import { PokeButton } from "@/components/poke-button";
import { Flipper, Flipped } from "react-flip-toolkit";
import { useState } from "react";

function PokeItemSkeleton() {
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

export function UserPokes() {
  const { data: pokesData, isLoading, error, refetch } = usePokeData();
  const orderedPokeRelations = useOrderedPokeRelations();
  const flipKey = orderedPokeRelations.map(r => r.id).join(",");
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white/90">Your Pokes</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
            disabled={true}
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
          </Button>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <PokeItemSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white/90">Your Pokes</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <p className="text-red-400 font-medium">Failed to load your pokes</p>
          <p className="text-sm text-white/60 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!pokesData || pokesData.count === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white/90">Your Pokes</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <Zap className="h-12 w-12 mx-auto mb-3 text-white/50" />
          <p className="text-white/80 font-medium">No pokes yet!</p>
          <p className="text-sm text-white/60 mt-1">Start poking people to see them here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-row justify-between gap-4 w-full">
          <div className="flex flex-col gap-2 text-sm text-white/70 text-start">
            <h2 className="text-2xl font-bold text-white/90">Your Pokes</h2>
            <span>{pokesData.count} relations • {pokesData.totalPokes} total pokes</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={async () => {
              console.log('Refreshing pokes...');
              setIsRefreshing(true);
              try {
                await refetch();
              } finally {
                setIsRefreshing(false);
              }
            }}
            className="text-white/70 hover:text-white hover:bg-white/10"
            disabled={isLoading || isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading || isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <Flipper flipKey={flipKey} spring="veryGentle">
        <div className="space-y-4">
          {orderedPokeRelations.map((pokeRelation) => {
            const isYourTurn = pokeRelation.lastPokeBy == pokeRelation.otherUser.id;

            return (
              <Flipped key={pokeRelation.id} flipId={pokeRelation.id}>
                <div
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                      {pokeRelation.otherUser.image ? (
                        <img
                          src={pokeRelation.otherUser.image}
                          alt={pokeRelation.otherUser.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-white/70" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-white/90">{pokeRelation.otherUser.name}</p>
                      <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(pokeRelation.lastPokeDate,{
                            addSuffix : true
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="font-semibold text-white/90">{pokeRelation.count}</span>
                    </div>
                    {isYourTurn && (
                      <div className="mt-2">
                        <PokeButton
                          targetUserId={pokeRelation.otherUser.id}
                          targetUserName={pokeRelation.otherUser.name}
                          variant="outline"
                          size="sm"
                          className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </Flipped>
            );
          })}
        </div>
      </Flipper>
    </div>
  );
} 