import { create } from "zustand";
import { Wallet } from "./useWalletContext";

interface AppState {
  currentWallet?: Wallet | undefined;
  setCurrentWallet: (wallet: Wallet | undefined) => void;
  resetAppState: () => void;
}

export const useAppState = create<AppState>((set) => ({
  setCurrentWallet: (wallet) => set({ currentWallet: wallet }),
  resetAppState: () => set({ currentWallet: undefined }),
}));
