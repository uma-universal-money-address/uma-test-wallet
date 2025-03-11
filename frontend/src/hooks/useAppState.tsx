import { create } from "zustand";
import { Wallet } from "./useWalletContext";

interface AppState {
  isUmaSelectorDialogOpen: boolean;
  isCreateUmaDialogOpen: boolean;
  isLoggedIn: boolean;
  currentWallet?: Wallet | undefined;
  notificationsStepCompleted: boolean;
  setIsLoggedIn: (isLoggedIn: boolean) => void;
  setCurrentWallet: (wallet: Wallet | undefined) => void;
  resetAppState: () => void;
  setIsUmaSelectorDialogOpen: (isOpen: boolean) => void;
  setIsCreateUmaDialogOpen: (isOpen: boolean) => void;
  setNotificationsStepCompleted: (completed: boolean) => void;
}

export const useAppState = create<AppState>((set) => ({
  isLoggedIn: false,
  isUmaSelectorDialogOpen: false,
  isCreateUmaDialogOpen: false,
  notificationsStepCompleted: false,
  setIsLoggedIn: (isLoggedIn) => set({ isLoggedIn }),
  setCurrentWallet: (wallet) => set({ currentWallet: wallet }),
  resetAppState: () =>
    set({
      isLoggedIn: false,
      currentWallet: undefined,
      isUmaSelectorDialogOpen: false,
      isCreateUmaDialogOpen: false,
      notificationsStepCompleted: false,
    }),
  setIsUmaSelectorDialogOpen: (isOpen) =>
    set({ isUmaSelectorDialogOpen: isOpen }),
  setIsCreateUmaDialogOpen: (isOpen) => set({ isCreateUmaDialogOpen: isOpen }),
  setNotificationsStepCompleted: (completed) => set({ notificationsStepCompleted: completed }),
}));
