import { createFileRoute } from "@tanstack/react-router";
import { UserSearch } from "@/components/user-search";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Find Users to Poke</h1>
        <p className="text-muted-foreground">
          Search for users and send them pokes in real-time!
        </p>
      </div>
      
      <UserSearch />
    </div>
  );
} 