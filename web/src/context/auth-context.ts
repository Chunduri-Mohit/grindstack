import { createContext } from "react";
import type React from "react";
import type { User } from "firebase/auth";
import type { UserProfile } from "../db/localDb";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isFirebaseConfigured: boolean;
  loginAsGuest: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
