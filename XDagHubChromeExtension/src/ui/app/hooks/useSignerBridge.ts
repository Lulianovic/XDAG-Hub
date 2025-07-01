import { SignerBridge } from "../UiBridge/SignerBridge";
import { useActiveAccount } from "./useActiveAccount";
import { thunkExtras } from "_redux/store/thunk-extras";

export function useSignerBridge(): SignerBridge | null {
  const activeAccount = useActiveAccount();
  const { uiBridge, background } = thunkExtras;
  if (!activeAccount) {
    throw new Error("Can't find account for the signer address ");
  }

  return uiBridge.createSignerBridge(activeAccount.address);
}
