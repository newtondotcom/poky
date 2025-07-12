import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar, Zap, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

function PokeItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
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
  const { data: pokesData, isLoading, error, refetch } = useQuery(trpc.getUserPokes.queryOptions());

  // Store ordered poke relations in a memoized array
  const orderedPokeRelations = useMemo(() => {
    if (!pokesData?.pokeRelations) return [];
    
    return [...pokesData.pokeRelations].sort((a, b) => {
      const aIsYourTurn = a.lastPokeBy !== a.otherUser.id;
      const bIsYourTurn = b.lastPokeBy !== b.otherUser.id;
      
      // First priority: Show relations where it's your turn to poke (someone is waiting for you)
      if (aIsYourTurn && !bIsYourTurn) return -1;
      if (!aIsYourTurn && bIsYourTurn) return 1;
      
      // Second priority: When both are in the same state (both your turn or both their turn),
      // sort by highest count first
      if (a.count !== b.count) {
        return b.count - a.count; // Higher count first
      }
      
      // Third priority: If counts are equal, sort by most recent last poke date
      return new Date(b.lastPokeDate).getTime() - new Date(a.lastPokeDate).getTime();
    });
  }, [pokesData?.pokeRelations]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
        <CardTitle>Your Pokes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <PokeItemSkeleton key={index} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Pokes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p>Failed to load your pokes</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pokesData || pokesData.count === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Pokes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No pokes yet!</p>
            <p className="text-sm">Start poking people to see them here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Your Pokes</span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{pokesData.count} relations</span>
            <span>•</span>
            <span>{pokesData.totalPokes} total pokes</span>
          </div>
          <Button variant={"ghost"} onClick={() => refetch()}>
            <RefreshCw />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {orderedPokeRelations.map((pokeRelation) => {
            const isYourTurn = pokeRelation.lastPokeBy !== pokeRelation.otherUser.id;
            
            // Determine the status indicator
            let statusIcon, statusColor, statusText, statusBgColor;
            
            if (isYourTurn) {
              statusIcon = <ArrowRight className="h-4 w-4" />;
              statusColor = "text-green-600";
              statusBgColor = "bg-green-100 dark:bg-green-900/20";
              statusText = "Your turn to poke";
            } else {
              statusIcon = <ArrowLeft className="h-4 w-4" />;
              statusColor = "text-red-600";
              statusBgColor = "bg-red-100 dark:bg-red-900/20";
              statusText = "Waiting for their poke";
            }

            return (
              <div
                key={pokeRelation.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    {pokeRelation.otherUser.image ? (
                      <img
                        src={pokeRelation.otherUser.image}
                        alt={pokeRelation.otherUser.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{pokeRelation.otherUser.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pokeRelation.otherUser.username ? `@${pokeRelation.otherUser.username}` : 'No username'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Last poke: {new Date(pokeRelation.lastPokeDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{pokeRelation.count}</span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusBgColor} ${statusColor}`}>
                    {statusIcon}
                    <span>{statusText}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 