import type { SerializedSignature } from "../cryptography/signature.js";

export type SignedTransaction = {
  transactionBlockBytes: string ;
  signature: SerializedSignature;
};

export type SignedMessage = {
  messageBytes: Uint8Array;
  signature: string;
};
