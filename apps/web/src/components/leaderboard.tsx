import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, User, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function LeaderboardItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="flex items-center gap-3">
        <Skeleton className="w-8 h-8 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-4 w-6" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-300" />;
  if (rank === 3) return <Award className="h-5 w-5 text-amber-500" />;
  return null;
}

function getRankColor(rank: number) {
  if (rank === 1) return "text-yellow-400 font-bold";
  if (rank === 2) return "text-gray-300 font-semibold";
  if (rank === 3) return "text-amber-500 font-semibold";
  return "text-white/70";
}

export function Leaderboard() {
  const { data: leaderboardData, isLoading, error } = useQuery(trpc.getLeaderboard.queryOptions());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white/90 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboard
        </h2>
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, index) => (
            <LeaderboardItemSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white/90 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboard
        </h2>
        <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <p className="text-red-400 font-medium">Failed to load leaderboard</p>
          <p className="text-sm text-white/60 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (!leaderboardData || leaderboardData.count === 0) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white/90 flex items-center gap-2">
          <Trophy className="h-6 w-6" />
          Leaderboard
        </h2>
        <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-white/50" />
          <p className="text-white/80 font-medium">No poke relations yet!</p>
          <p className="text-sm text-white/60 mt-1">Start poking people to see them on the leaderboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white/90 flex items-center gap-2">
        <Trophy className="h-6 w-6" />
        Leaderboard
      </h2>
      
      <div className="space-y-4">
        {leaderboardData.entries.map((entry, index) => {
          const rank = index + 1;
          const rankIcon = getRankIcon(rank);
          const rankColor = getRankColor(rank);

          return (
            <div
              key={entry.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 min-w-[60px]">
                  {rankIcon}
                  <span className={`text-sm ${rankColor}`}>
                    #{rank}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* User A */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                      {entry.userA.image ? (
                        <img
                          src={entry.userA.image}
                          alt={entry.userA.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white/70" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-white/90">{entry.userA.name}</span>
                  </div>
                  
                  <span className="text-white/60">X</span>
                  
                  {/* User B */}
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center ring-2 ring-white/30">
                      {entry.userB.image ? (
                        <img
                          src={entry.userB.image}
                          alt={entry.userB.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white/70" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-white/90">{entry.userB.name}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-white/90">
                    {entry.count}
                  </span>
                  <span className="text-sm text-white/60">pokes</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/60 mt-1">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDistanceToNow(new Date(entry.lastPokeDate), {
                      addSuffix: true
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 