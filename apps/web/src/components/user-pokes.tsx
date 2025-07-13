import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Calendar, Zap, RefreshCw, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePokeData, useOrderedPokeRelations } from "@/stores/poke-store";
import { formatDistanceToNow } from "date-fns";
import { PokeButton } from "@/components/poke-button";
import { Flipper, Flipped } from "react-flip-toolkit";

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
  const { data: pokesData, isLoading, error, refetch } = usePokeData();
  const orderedPokeRelations = useOrderedPokeRelations();  // Use a string that changes when the order changes as the flipKey
  const flipKey = orderedPokeRelations.map(r => r.id).join(",");

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
      <Flipper flipKey={flipKey} spring="veryGentle">
        <div className="space-y-3">
          {orderedPokeRelations.map((pokeRelation) => {
            const isYourTurn = pokeRelation.lastPokeBy == pokeRelation.otherUser.id;
            
            // Determine the status indicator
            let statusIcon, statusColor, statusText, statusBgColor;
            
            if (isYourTurn) {
              statusColor = "text-green-600";
              statusBgColor = "bg-green-100 dark:bg-green-900/20";
            } else {
              statusColor = "text-red-600";
              statusBgColor = "bg-red-100 dark:bg-red-900/20";
            }

            return (
              <Flipped key={pokeRelation.id} flipId={pokeRelation.id}>
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-semibold">{pokeRelation.count}</span>
                  </div>
                  {isYourTurn && (
                    <div className="mt-2">
                      <PokeButton
                        targetUserId={pokeRelation.otherUser.id}
                        targetUserName={pokeRelation.otherUser.name}
                        variant="outline"
                        size="sm"
                        className="text-green-400"
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
      </CardContent>
    </Card>
  );
} 