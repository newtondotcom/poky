import { User, Calendar, Zap} from "lucide-react";
import { usePokeData, useOrderedPokeRelations } from "@/stores/poke-store";
import { formatDistanceToNow } from "date-fns";
import { PokeButton } from "@/components/poke-button";
import { Flipper, Flipped } from "react-flip-toolkit";
import { PokeItemSkeleton } from "@/components/skeletons/poke-item";
import { timestampDate } from "@bufbuild/protobuf/wkt";

export function UserPokes() {
  const { data: pokesData, isLoading, error, isConnected } = usePokeData();
  const orderedPokeRelations = useOrderedPokeRelations();
  const flipKey = orderedPokeRelations.map((r) => r.id).join(",");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white/90">Your Pokes</h2>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          </div>
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
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-xs text-white/50">Disconnected</span>
          </div>
        </div>
        <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <p className="text-red-400 font-medium">Failed to load your pokes</p>
          <p className="text-sm text-white/60 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!orderedPokeRelations || orderedPokeRelations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white/90">Your Pokes</h2>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>
        <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <Zap className="h-12 w-12 mx-auto mb-3 text-white/50" />
          <p className="text-white/80 font-medium">No pokes yet!</p>
          <p className="text-sm text-white/60 mt-1">
            Start poking people to see them here
          </p>
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
            <span>
              {pokesData?.count} relations • {pokesData?.totalPokes} total pokes
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>
      </div>

      <Flipper flipKey={flipKey} spring="veryGentle">
        <div className="space-y-4">
          {orderedPokeRelations.map((pokeRelation) => {
            const isYourTurn =
              pokeRelation.lastPokeBy == pokeRelation.otherUser.id;

            return (
              <Flipped key={pokeRelation.id} flipId={pokeRelation.id}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]">
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
                      <p className="font-medium text-white/90">
                        {pokeRelation.otherUser.name}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {formatDistanceToNow(timestampDate(pokeRelation.lastPokeDate), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row items-center align-middle space-x-2">
                    {isYourTurn && (
                      <PokeButton
                        targetUserId={pokeRelation.otherUser.id}
                        targetUserName={pokeRelation.otherUser.name}
                        variant="outline"
                        size="sm"
                        className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                      />
                    )}
                    <div className="flex items-center gap-2 justify-end">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span className="font-semibold text-white/90">
                        {pokeRelation.count}
                      </span>
                    </div>
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
