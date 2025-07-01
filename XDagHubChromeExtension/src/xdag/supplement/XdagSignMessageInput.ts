import type { WalletAccount } from "@wallet-standard/core";
import { SignedMessage } from "../typescript/signers";

export type XdagSignMessageMethod = (
  input: XdagSignMessageInput,
) => Promise<XdagSignMessageOutput>;

export interface XdagSignMessageInput {
  message: Uint8Array;
  account: WalletAccount;
}

export interface XdagSignMessageOutput extends SignedMessage {}
