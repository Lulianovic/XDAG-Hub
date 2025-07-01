import type { XDagAddress } from "_src/xdag/typescript/types";
import type { XDagTransactionBlockResponse } from "_src/xdag/typescript/types";
import type { XdagSignMessageOutput } from "_src/xdag/features";
import { SignedTransaction } from "_src/xdag/typescript/signers";

export type TransactionDataType = {
	type: "transaction";	
	accountAddress?:XDagAddress;
	toAddress?: XDagAddress;
	amount?: number;
	remark?: string;
	justSign?: boolean;
	data?:string;
};

export type SignMessageDataType = {
	type: "sign-message";
	accountAddress: XDagAddress;
	message: string;
};

export type ApprovalRequest = {
	id: string;
	approved: boolean | null;
	origin: string;
	originFavIcon?: string;
	txResult?: XDagTransactionBlockResponse | XdagSignMessageOutput;
	txResultError?: string;
	txSigned?: SignedTransaction;
	createdDate: string;
	tx: TransactionDataType | SignMessageDataType;
};

export interface SignMessageApprovalRequest extends Omit<ApprovalRequest, "txResult" | "tx">
{
	tx: SignMessageDataType;
	txResult?: XdagSignMessageOutput;
}

export interface TransactionApprovalRequest extends Omit<ApprovalRequest, "txResult" | "tx">
{
	tx: TransactionDataType;
	txResult?: XDagTransactionBlockResponse;
}

export function isSignMessageApprovalRequest( request: ApprovalRequest, ): request is SignMessageApprovalRequest {
	return request.tx.type === "sign-message";
}

export function isTransactionApprovalRequest( request: ApprovalRequest, ): request is TransactionApprovalRequest {
	return request.tx.type !== "sign-message";
}
