import { Button } from "@/components/ui/button";
import { Zap, Loader2 } from "lucide-react";
import { usePokeUser } from "@/stores/poke-store";
import { toast } from "@pheralb/toast";

interface PokeButtonProps {
  targetUserId: string;
  targetUserName: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onPokeSuccess?: () => void;
}

export function PokeButton({ 
  targetUserId, 
  targetUserName, 
  variant = "default",
  size = "default",
  className,
  onPokeSuccess
}: PokeButtonProps) {
  const { pokeUser, isPoking} = usePokeUser();

  const handlePoke = async () => {
    try {
      await pokeUser(targetUserId);
      toast.success({ text: `Poked ${targetUserName}! 🎯` });
      // Call the success callback if provided
      onPokeSuccess?.();
    } catch (err) {
      toast.error({ text: `Failed to poke ${targetUserName}` });
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePoke}
      disabled={isPoking}
      className={className}
    >
      {isPoking ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Zap className="h-4 w-4" />
      )}
      {size !== "icon" && (isPoking ? "Poking..." : "Poke")}
    </Button>
  );
} 