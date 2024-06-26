import { useMemo } from "react";
import { useActiveAddress } from "./useActiveAddress";
import useAppSelector from "./useAppSelector";
import {
  getMainBlockUrl,
  getTransactionUrl,
} from "../components/explorer-link/Explorer";
import { ExplorerLinkType } from "../components/explorer-link/ExplorerLinkType";
import { type XDagAddress, type TransactionDigest } from "_src/xdag/typescript/types";

export type ExplorerLinkConfig =
  | { type: ExplorerLinkType.address; address: XDagAddress; useActiveAddress?: false; }
  | { type: ExplorerLinkType.address; useActiveAddress: true }
  | { type: ExplorerLinkType.transaction; transactionID: TransactionDigest }

function useAddress(linkConfig: ExplorerLinkConfig) {
  const { type } = linkConfig;
  const isAddress = type === ExplorerLinkType.address;
  const isProvidedAddress = isAddress && !linkConfig.useActiveAddress;
  const activeAddress = useActiveAddress();
  return isProvidedAddress ? linkConfig.address : activeAddress;
}

export function useExplorerLink(linkConfig: ExplorerLinkConfig) {
  const { type } = linkConfig;
  const address = useAddress(linkConfig);
  const [selectedApiEnv, customRPC] = useAppSelector(({ app }) => [
    app.apiEnv,
    app.fullNode,
  ]);
  const transactionID = type === ExplorerLinkType.transaction ? linkConfig.transactionID : null;
  const customFullNode = customRPC ?? "";
  return useMemo(() => {
    switch (type) {
      case ExplorerLinkType.address:
        return address && getMainBlockUrl(address, selectedApiEnv, customFullNode);
      case ExplorerLinkType.transaction:
        return (transactionID && getTransactionUrl(transactionID, selectedApiEnv, customFullNode));
    }
  }, [type, address, selectedApiEnv, customFullNode, transactionID]);
}
