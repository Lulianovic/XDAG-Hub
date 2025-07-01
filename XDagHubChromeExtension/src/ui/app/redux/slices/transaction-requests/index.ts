import { createAsyncThunk, createEntityAdapter, createSlice, } from "@reduxjs/toolkit";
import { getSignerOperationErrorMessage } from "_src/ui/app/helpers/errorMessages";
import { fromB64, fromHEX, toHEX } from "_src/xdag/bcs";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ApprovalRequest } from "_payloads/transactions/ApprovalRequest";
import type { RootState } from "_redux/RootReducer";
import { XDagTransactionBlockResponse } from "_src/xdag/typescript/types";
import { SignedMessage, SignedTransaction } from "_src/xdag/typescript/signers";
import { AppThunkConfig } from "../../store/thunk-extras";
import { TransactionHelper } from "_src/xdag/typescript/builder";
import { accountsAdapterSelectors, activeAccountSelector } from "../account";
import { getApiEnv } from "../app";

const txRequestsAdapter = createEntityAdapter<ApprovalRequest>({
	sortComparer: (a, b) => {
		const aDate = new Date(a.createdDate);
		const bDate = new Date(b.createdDate);
		return aDate.getTime() - bDate.getTime();
	},
});

export const respondToTransactionRequest = createAsyncThunk<
	{ txRequestID: string; approved: boolean; txResponse: XDagTransactionBlockResponse | SignedMessage | undefined; },
	{ txRequestID: string; approved: boolean;  },
	AppThunkConfig
>(
	"respond-to-transaction-request",
	async ({ txRequestID, approved }, { extra: { uiBridge, background }, getState },) => {
		const state = getState();
		const activeAccount = activeAccountSelector(state);
		const apiEnv = getApiEnv(state);
		const txRequest = txRequestsSelectors.selectById(state, txRequestID);
		
		if (!txRequest || !activeAccount?.publicKey) {
			throw new Error(`TransactionRequest ${txRequestID} not found or no active account`);
		}
		let txSigned: SignedTransaction | undefined = undefined;
		let txResult: XDagTransactionBlockResponse | SignedMessage | undefined = undefined;
		let txResultError: string | undefined;
		if (approved) {
			try {
				if (txRequest.tx.type === "sign-message") {
					const sender = txRequest.tx.accountAddress;
					if (!sender) {
						throw new Error("Invalid sender in respondToTransactionRequest",);
					}
					const signer = uiBridge.createSignerBridge(sender);
					const messageBytes = toHEX( fromB64(txRequest.tx.message));
					const signString = await signer.signData(messageBytes);
					txResult = {
						messageBytes: fromHEX(messageBytes),
						signature: signString,
					};
				} else if (txRequest.tx.type === "transaction") {
					const sender = txRequest.tx.accountAddress;
					const amount = String(txRequest.tx.amount);
					const remark = txRequest.tx?.remark ?? "";
					const to = txRequest.tx.toAddress;
					if (!to || !amount || !sender) {
						throw new Error("Invalid transaction request in respondToTransactionRequest",);
					}
					const nonce = await uiBridge.rpcBridge.provider.getNonce(sender);
					if (nonce === null || nonce === "0") {
						throw new Error("Invalid nonce from xdag block chain",);
					}
					const tx = TransactionHelper.createTransactionBlock({
						senderPublicKey:activeAccount.publicKey,
						sender,
						amount,
						remark,
						to,
						nonce,
						networkEnv:apiEnv
					});
					if (txRequest.tx.justSign) {
						throw new Error("还没有实现的功能",);
					} else {
						if (!tx || !tx.blockData.sender || !tx.blockData.nonce) {
							throw new Error("Invalid transaction");
						}
						let txSigned: string | undefined = undefined;
						let txResult: XDagTransactionBlockResponse | undefined = undefined;
						let txResultError: string | undefined;
						const signerBridge = uiBridge.createSignerBridge(sender);
						if (approved) {
							try {
								const h = await tx.buildPart();
								if (!h) {
									throw new Error("Invalid hash in transactionBusiness in transaction-requests");
								}
								txSigned = await signerBridge.signData(h);
								const signData = await tx.buildFinally(fromHEX(txSigned));
								const response = await uiBridge.rpcBridge.provider.executeSendRawTransaction(tx, signData);
								txResult = response;
							} catch (error) {
								txResultError = getSignerOperationErrorMessage(error);
								throw new Error(txResultError);
							}
						}
						return { txRequestID, approved, txResponse: txResult };
					}
				} else {
					throw new Error(`Unexpected type: ${(txRequest.tx as any).type}`,);
				}
			} catch (error) {
				txResultError = getSignerOperationErrorMessage(error);
			}
		}
		background.sendTransactionRequestResponse(txRequestID, approved, txResult, txResultError, txSigned,);
		return { txRequestID, approved, txResponse: txResult };
	}
);

const slice = createSlice({
	name: "transaction-requests",
	initialState: txRequestsAdapter.getInitialState({
		initialized: false,
	}),
	reducers: {
		setTransactionRequests: (state, { payload }: PayloadAction<ApprovalRequest[]>,) => {
			txRequestsAdapter.setAll(state, payload);
			state.initialized = true;
		},
	},
	extraReducers: (build) => {
		build.addCase(
			respondToTransactionRequest.fulfilled,
			(state, { payload }) => {
				const { txRequestID, approved: allowed, txResponse } = payload;
				txRequestsAdapter.updateOne(state, {
					id: txRequestID,
					changes: {
						approved: allowed,
						txResult: txResponse || undefined,
					},
				});
			},
		);
	},
});

export default slice.reducer;
export const { setTransactionRequests } = slice.actions;

export const txRequestsSelectors = txRequestsAdapter.getSelectors(
	(state: RootState) => state.transactionRequests,
);
