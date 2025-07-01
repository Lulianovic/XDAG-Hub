import type { SerializedSignature } from "../cryptography/signature";

export type SignedTransaction = {
  transactionBlockBytes: string ;
  signature: SerializedSignature;
};

export type SignedMessage = {
  messageBytes: Uint8Array;
  signature: string;
};
