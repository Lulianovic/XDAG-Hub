
import type { Payload } from "./Payload";

export type PayloadType =
  | "permission-request"
  | "permission-response"
  | "get-permission-requests"
  | "get-account"
  | "get-account-response"
  | "has-permissions-request"
  | "has-permissions-response"
  | "acquire-permissions-request"
  | "acquire-permissions-response"
  | "execute-transaction-request"
  | "execute-transaction-response"
  | "sign-transaction-request"
  | "sign-transaction-response"
  | "get-transaction-requests"
  | "get-transaction-requests-response"
  | "transaction-request-response"
  | "update-active-origin"
  | "disconnect-app"
  | "done"
  | "keyring"
  | "stake-request"
  | "wallet-status-changed"
  | "get-features"
  | "features-response"
  | "get-network"
  | "set-network"
  | "sign-message-request"
  | "execute-inscription-request"
  | "execute-inscription-response"
  | "inscription-request-response"
  | "get-inscription-requests"
  | "get-inscription-requests-response"

export interface BasePayload {
  type: PayloadType;
}

export function isBasePayload(payload: Payload): payload is BasePayload {
  return "type" in payload && typeof payload.type !== "undefined";
}
