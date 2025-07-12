import { create } from 'zustand';
import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import React from 'react';

interface PokeRelation {
  id: string;
  count: number;
  userAId: string;
  userBId: string;
  lastPokeDate: string;
  lastPokeBy: string;
  visibleLeaderboard: boolean;
  otherUser: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
}

interface PokeData {
  count: number;
  totalPokes: number;
  pokeRelations: PokeRelation[];
}

interface PokeStore {
  // State
  pokesData: PokeData | null;
  isLoading: boolean;
  error: any;
  orderedPokeRelations: PokeRelation[];
  
  // Actions
  setPokesData: (data: PokeData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: any) => void;
  updateOrderedRelations: () => void;
  getOrderedPokeRelations: (pokeRelations: PokeRelation[]) => PokeRelation[];
}

export const usePokeStore = create<PokeStore>((set, get) => ({
  // Initial state
  pokesData: null,
  isLoading: false,
  error: null,
  orderedPokeRelations: [],

  // Set pokes data
  setPokesData: (data) => {
    set({ pokesData: data });
    get().updateOrderedRelations();
  },

  // Set loading state
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  // Set error state
  setError: (error) => {
    set({ error });
  },

  // Update ordered relations when data changes
  updateOrderedRelations: () => {
    const { pokesData } = get();
    if (pokesData?.pokeRelations) {
      const ordered = get().getOrderedPokeRelations(pokesData.pokeRelations);
      set({ orderedPokeRelations: ordered });
    } else {
      set({ orderedPokeRelations: [] });
    }
  },

  // Get ordered poke relations based on the provided data
  getOrderedPokeRelations: (pokeRelations) => {
    if (!pokeRelations) return [];
    
    return [...pokeRelations].sort((a, b) => {
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
  },
}));

// Hook to use poke data with React Query
export const usePokeData = () => {
  const { data, isLoading, error, refetch } = useQuery(trpc.getUserPokes.queryOptions());
  const { setPokesData, setLoading, setError } = usePokeStore();

  // Update store when query data changes
  React.useEffect(() => {
    setPokesData(data || null);
  }, [data, setPokesData]);

  React.useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  React.useEffect(() => {
    setError(error);
  }, [error, setError]);

  return { data, isLoading, error, refetch };
};

// Helper hooks for easier access
export const usePokeLoading = () => usePokeStore((state) => state.isLoading);
export const usePokeError = () => usePokeStore((state) => state.error);
export const useOrderedPokeRelations = () => usePokeStore((state) => state.orderedPokeRelations);
export const usePokeActions = () => usePokeStore((state) => ({
  setPokesData: state.setPokesData,
  setLoading: state.setLoading,
  setError: state.setError,
  updateOrderedRelations: state.updateOrderedRelations,
})); 