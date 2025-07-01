import { API_ENV } from "xdag/shared/api-env";
import { TransactionBlock } from "xdag/typescript/builder";

export interface TransactionInfo
{
	senderPublicKey: string|undefined;
	sender: string,
	to: string;
	amount: string;
	remark: string;
	nonce: string;
	networkEnv: API_ENV;
}

export class TransactionHelper {
    static createTransactionBlock({sender, to, amount, remark,nonce,senderPublicKey,networkEnv}: TransactionInfo): TransactionBlock {
        const tx = new TransactionBlock();
		tx.setSender(sender);
		tx.setReceiver(to);
		tx.setAmount(amount);
		tx.setRemark(remark);
		tx.setNonce("0");
		tx.setNonce(nonce);
		tx.setNetworkEnv(networkEnv);
		tx.setPublicKey(senderPublicKey);
        return tx;
    }
}
