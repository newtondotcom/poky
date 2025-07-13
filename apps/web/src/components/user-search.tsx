import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Plus, Search, User, X, Calendar, Zap } from "lucide-react";
import { toast } from "sonner";
import type { SearchUserResult } from "../../../server/src/procedures/search-users";
import { useQuery } from "@tanstack/react-query";
import { PokeButton } from "@/components/poke-button";
import { formatDistanceToNow } from "date-fns";

function SearchResultSkeleton() {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
    </div>
  );
}

function UserSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Use tRPC query for searching users
  const searchUsersQuery = useQuery(trpc.searchUsers.queryOptions(
    {
      query: searchQuery,
    },
    {
      enabled: false, // Don't auto-run, only when we explicitly search
      retry: false,
    }
  ));

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }

    setIsSearching(true);
    try {
      await searchUsersQuery.refetch();
    } catch (error) {
      toast.error("Failed to search users");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Search Users</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name or nickname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
            autoFocus
          />
          <Button 
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Search Results */}
        {searchUsersQuery.isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SearchResultSkeleton key={index} />
            ))}
          </div>
        )}

        {searchUsersQuery.error && (
          <div className="text-center py-8 text-red-500">
            <p>Failed to search users</p>
            <p className="text-sm text-muted-foreground">
              {searchUsersQuery.error.message}
            </p>
          </div>
        )}

        {searchUsersQuery.data && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Found {searchUsersQuery.data.count} user(s)
            </p>
            
            {searchUsersQuery.data.users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No users found</p>
                <p className="text-sm">Try a different search term</p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchUsersQuery.data.users.map((user: SearchUserResult) => {
                  const isYourTurn = user.lastPokeBy === user.id;
                  
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3" />
                            {user.hasPokeRelation && user.lastPokeDate ? (
                              <span>
                                {formatDistanceToNow(new Date(user.lastPokeDate), {
                                  addSuffix: true
                                })}
                              </span>
                            ) : (
                              <span>
                                Joined {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {user.hasPokeRelation ? (
                          <>
                            <div className="flex items-center gap-2 justify-end mb-1">
                              <Zap className="h-4 w-4 text-yellow-500" />
                              <span className="font-semibold">{user.pokeCount}</span>
                            </div>
                            {isYourTurn && (
                              <PokeButton
                                targetUserId={user.id}
                                targetUserName={user.name}
                                variant="outline"
                                size="sm"
                                className="text-green-400"
                              />
                            )}
                          </>
                        ) : (
                          <PokeButton
                            targetUserId={user.id}
                            targetUserName={user.name}
                            variant="outline"
                            size="sm"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Initial state */}
        {!searchUsersQuery.data && !searchUsersQuery.isLoading && !searchUsersQuery.error && (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Search for users</p>
            <p className="text-sm">Enter a name or nickname to find people to poke</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function UserSearch() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)}
        className="w-full"
        variant="outline"
      >
        <Plus className="h-4 w-4 mr-2" />
        Search Users
      </Button>
      
      <UserSearchModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
} 