import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Search, User } from "lucide-react";
import { toast } from "sonner";
import type { SearchUserResult } from "../../../server/src/procedures/search-users";
import { useQuery } from "@tanstack/react-query";

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

export function UserSearch() {
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Search by name or nickname..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyPress}
            className="flex-1"
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
            Search
          </Button>
        </div>

        {/* Search Results */}
        {searchUsersQuery.isLoading && (
          <div className="flex items-center justify-center py-8">
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
                {searchUsersQuery.data.users.map((user: SearchUserResult) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center">
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
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 