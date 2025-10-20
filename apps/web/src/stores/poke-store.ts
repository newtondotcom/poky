import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import { useContext, useMemo, useEffect } from "react";
import { createCallbackClient, type ConnectError } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-web";
import { PokesService } from "@/rpc/proto/poky/v1/pokes_service_pb";
import { AuthContext, type IAuthContext } from "react-oauth2-code-pkce";

// -------------------
// Zustand store
// -------------------
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
  pokesData: PokeData | null;
  isLoading: boolean;
  error: any;
  orderedPokeRelations: PokeRelation[];
  isConnected: boolean;

  setPokesData: (data: PokeData | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: any) => void;
  setConnectionStatus: (connected: boolean) => void;
  getOrderedPokeRelations: (pokeRelations: PokeRelation[]) => PokeRelation[];
}

export const usePokeStore = create<PokeStore>((set, get) => ({
  pokesData: null,
  isLoading: false,
  error: null,
  orderedPokeRelations: [],
  isConnected: false,

  setPokesData: (data) => {
    const orderedRelations = data?.pokeRelations
      ? get().getOrderedPokeRelations(data.pokeRelations)
      : [];
    set({ pokesData: data, orderedPokeRelations: orderedRelations });
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setConnectionStatus: (connected) => set({ isConnected: connected }),

  getOrderedPokeRelations: (pokeRelations) => {
    if (!pokeRelations) return [];
    return [...pokeRelations].sort((a, b) => {
      const aIsYourTurn = a.lastPokeBy === a.otherUser.id;
      const bIsYourTurn = b.lastPokeBy === b.otherUser.id;

      if (aIsYourTurn && !bIsYourTurn) return -1;
      if (!aIsYourTurn && bIsYourTurn) return 1;

      if (a.count !== b.count) return b.count - a.count;

      return new Date(b.lastPokeDate).getTime() - new Date(a.lastPokeDate).getTime();
    });
  },
}));

// -------------------
// Hook: create client with token
// -------------------
export const usePokesClient = () => {
  const { token } = useContext<IAuthContext>(AuthContext);

  const client = useMemo(() => {
    const transport = createConnectTransport({
      baseUrl: "http://localhost:8080",
      interceptors: [
        (next) => (request) => {
          console.log(token)
          request.header.append("Authorization", `Bearer ${token}`);
          return next(request);
        },
      ],
      defaultTimeoutMs : 20*60*1000
    });

    return createCallbackClient(PokesService, transport);
  }, [token]);

  return client;
};

// -------------------
// Hook: streaming poke data
// -------------------
export const usePokeData = () => {
  const client = usePokesClient();
  const { setPokesData, setLoading, setError, setConnectionStatus } = usePokeStore(
    useShallow((state) => ({
      setPokesData: state.setPokesData,
      setLoading: state.setLoading,
      setError: state.setError,
      setConnectionStatus: state.setConnectionStatus,
    })),
  );

  useEffect(() => {
    setLoading(true);
    setConnectionStatus(false);

    // Start streaming
    const stream = client.getUserPokes(
      {},
      (res) => {
        setPokesData(res as any);
        setLoading(false);
        setConnectionStatus(true);
      },
      (err?: ConnectError) => {
        if (err) {
          setError(err);
          setLoading(false);
          setConnectionStatus(false);
        }
      },
    );

    // Cleanup
    return () => {
      setConnectionStatus(false);
      if (stream && typeof stream.close === "function") stream.close();
    };
  }, [client, setPokesData, setLoading, setError, setConnectionStatus]);

  return usePokeStore(
    useShallow((state) => ({
      data: state.pokesData,
      isLoading: state.isLoading,
      error: state.error,
      isConnected: state.isConnected,
    })),
  );
};

// -------------------
// Helper hooks
// -------------------
export const useOrderedPokeRelations = () =>
  usePokeStore((state) => state.orderedPokeRelations);

export const useConnectionStatus = () =>
  usePokeStore((state) => state.isConnected);
