import { API_ENV } from "_src/shared/api-env";
import { parseAmount } from "_src/ui/app/helpers";
import { TransactionBlock } from "_src/xdag/typescript/builder";

export interface TransactionInfo
{
	senderPublicKey: string|undefined;
	sender: string,
	to: string;
	amount: string;
	// coinDecimals?: number;
	remark: string;
	nonce: string;
	networkEnv: API_ENV;
}

export class TransactionHelper {
    static createTransactionBlock({sender, to, amount, remark,nonce,senderPublicKey,networkEnv}: TransactionInfo): TransactionBlock {

        const tx = new TransactionBlock();
        // const bigNumberAmount = parseAmount(amount);
		tx.setSender(sender);
		tx.setReceiver(to);
		tx.setAmount(amount);
		tx.setRemark(remark);
		tx.setNonce("0");
		tx.setNonce(nonce);
		tx.setNetworkEnv(networkEnv);
		tx.setPublicKey(senderPublicKey);
        // tx.transferXDag([bigNumberAmount, remark], to);
        // tx.transferXDag([tx.pure(bigNumberAmount), tx.pure(remark)], tx.pure(to));
        return tx;
    }
}
