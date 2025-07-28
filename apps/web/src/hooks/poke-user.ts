import { trpcClient } from "@/utils/trpc";
import { toast } from "@pheralb/toast";
import { useMutation } from "@tanstack/react-query";

// Hook to poke a user
export const usePokeUser = (onPokeSuccess?: () => void) => {
  const mutation = useMutation({
    mutationFn: (targetUserId: string) =>
      trpcClient.pokeUser.mutate({ targetUserId }),
    onSuccess: () => {
      // For subscriptions, the data will be updated automatically
      // No need to invalidate queries
      toast.success({ text: `Poked ! 🎯` });
      onPokeSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to poke user:", error);
    },
  });

  return {
    pokeUser: mutation.mutate,
    isPoking: mutation.isPending,
    error: mutation.error,
  };
};
