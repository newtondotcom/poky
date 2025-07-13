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
import React from "react";

function SearchResultSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
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
  const [localSearchResults, setLocalSearchResults] = useState<SearchUserResult[]>([]);

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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20 bg-white/10 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white/90">Search Users</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-white/20 bg-white/5 backdrop-blur-xl">
          <div className="flex items-center justify-center w-full">
            <div className="relative w-full max-w-md">
              <input 
                type="text" 
                placeholder="Search by name or nickname..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
                className="pr-12 pl-4 py-3 w-full text-white text-sm bg-black/20 border border-white/50 backdrop-blur-sm rounded-lg shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] placeholder:text-white/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-300 relative before:absolute before:inset-0 before:rounded-lg before:bg-gradient-to-br before:from-white/60 before:via-transparent before:to-transparent before:opacity-70 before:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:bg-gradient-to-tl after:from-white/30 after:via-transparent after:to-transparent after:opacity-50 after:pointer-events-none"
              />
              <button 
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="inline-flex items-center justify-center px-3 py-2 text-black text-xs font-medium rounded-md bg-white/80 border border-white/30 backdrop-blur-sm shadow-[inset_0_1px_0px_rgba(255,255,255,0.75),0_0_9px_rgba(0,0,0,0.2),0_3px_8px_rgba(0,0,0,0.15)] hover:bg-white/30 transition-all duration-300 absolute right-1 top-1/2 transform -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <Search className="size-3" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Search Results */}
          {searchUsersQuery.isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <SearchResultSkeleton key={index} />
              ))}
            </div>
          )}

          {searchUsersQuery.error && (
            <div className="text-center py-12 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
              <p className="text-red-400 font-medium">Failed to search users</p>
              <p className="text-sm text-white/60 mt-1">
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
                      className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl hover:bg-white/15 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 flex items-center justify-center flex-shrink-0 ring-2 ring-white/30">
                          {user.image ? (
                            <img
                              src={user.image}
                              alt={user.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-5 w-5 text-white/70" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-white/90">{user.name}</p>
                          <div className="flex items-center gap-2 text-xs text-white/60 mt-1">
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
                            <div className="flex items-center gap-2 justify-end mb-2">
                              <Zap className="h-4 w-4 text-yellow-400" />
                              <span className="font-semibold text-white/90">{user.pokeCount}</span>
                            </div>
                            {isYourTurn && (
                              <PokeButton
                                targetUserId={user.id}
                                targetUserName={user.name}
                                variant="outline"
                                size="sm"
                                className="text-green-400"
                                onPokeSuccess={onClose}
                              />
                            )}
                          </>
                        ) : (
                          <PokeButton
                            targetUserId={user.id}
                            targetUserName={user.name}
                            variant="outline"
                            size="sm"
                            onPokeSuccess={onClose}
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
    </div>
  );
}

export function UserSearch() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowModal(true)}
        className="w-full bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-xl rounded-2xl p-4 h-auto"
        variant="outline"
      >
        <Plus className="h-5 w-5 mr-3" />
        <span className="text-lg font-medium">Search Users</span>
      </Button>
      
      <UserSearchModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
      />
    </>
  );
}