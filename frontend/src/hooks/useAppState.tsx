import { create } from "zustand";
import { Wallet } from "./useWalletContext";

interface AppState {
  isUmaSelectorDialogOpen: boolean;
  isCreateUmaDialogOpen: boolean;
  currentWallet?: Wallet | undefined;
  setCurrentWallet: (wallet: Wallet | undefined) => void;
  resetAppState: () => void;
  setIsUmaSelectorDialogOpen: (isOpen: boolean) => void;
  setIsCreateUmaDialogOpen: (isOpen: boolean) => void;
}

export const useAppState = create<AppState>((set) => ({
  isUmaSelectorDialogOpen: false,
  isCreateUmaDialogOpen: false,
  setCurrentWallet: (wallet) => set({ currentWallet: wallet }),
  resetAppState: () =>
    set({
      currentWallet: undefined,
      isUmaSelectorDialogOpen: false,
      isCreateUmaDialogOpen: false,
    }),
  setIsUmaSelectorDialogOpen: (isOpen) =>
    set({ isUmaSelectorDialogOpen: isOpen }),
  setIsCreateUmaDialogOpen: (isOpen) => set({ isCreateUmaDialogOpen: isOpen }),
}));
