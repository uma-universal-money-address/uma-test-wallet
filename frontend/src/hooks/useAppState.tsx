import { create } from "zustand";
import { Wallet } from "./useWalletContext";

interface AppState {
  currentWallet?: Wallet;
  setCurrentWallet: (wallet: Wallet) => void;
}

export const useAppState = create<AppState>((set) => ({
  setCurrentWallet: (wallet) => set({ currentWallet: wallet }),
}));
