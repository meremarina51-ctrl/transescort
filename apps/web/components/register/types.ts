import { Role } from "@/lib/enums";

export type RegistrableRole = Role.Client | Role.Performer;

export interface PendingAuth {
  accessToken: string;
  refreshToken: string;
  user: any;
  recoveryCode: string;
}
