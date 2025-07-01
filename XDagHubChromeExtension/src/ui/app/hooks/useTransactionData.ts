import { useQuery } from "@tanstack/react-query";
import { useRpcClient } from "_src/xdag/api";
import { TransactionBlock } from "_src/xdag/typescript/builder";
import type { XDagAddress } from "_src/xdag/typescript/types";
import BigNumber from "bignumber.js";

export function useTransactionData(
	sender?: XDagAddress | null,
	transaction?: TransactionBlock | null,
) {
	return useQuery( {
		queryKey: [ "transaction-data", transaction?.serialize() ],
		queryFn: async () => {
			const clonedTransaction = new TransactionBlock( transaction! );
			if ( sender ) {
				clonedTransaction.setSender( sender );
			}
			await clonedTransaction!.buildPart();
			return clonedTransaction!.blockData;
		},
		enabled: !!transaction,
	} );
}

export function useTransactionGasBudget(
	sender?: XDagAddress | null,
	transaction?: TransactionBlock | null,
) {
	const { data, ...rest } = useTransactionData( sender, transaction );
	// const [ formattedGas ] = useFormatCoin( BigNumber((data?.gasConfig.budget??"0").toString()), XDAG_TYPE_ARG );
	const formattedGas = '0.2XDAG'
	return {
		data: formattedGas,
		...rest,
	};
}

export const useGasFee = ():BigNumber=> {
	return new BigNumber(0.1);
}


