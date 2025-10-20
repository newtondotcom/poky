import { PokesService } from "@/rpc/proto/poky/v1/pokes_service_pb";
import { useMutation } from "@connectrpc/connect-query";
import { toast } from "@pheralb/toast";

// Hook to poke a user
export const usePokeUser = (onPokeSuccess?: () => void) => {
  const mutation = useMutation(PokesService.method.pokeUser, {
    onSuccess: () => {
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
