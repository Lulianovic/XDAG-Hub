import { createAsyncThunk, createEntityAdapter, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { getSignerOperationErrorMessage } from "_src/ui/app/helpers/errorMessages";
import { XDagTransactionBlockResponse } from "_src/xdag/typescript/types";
import { SignedMessage } from "_src/xdag/typescript/signers";
import { fromHEX } from "_src/xdag/bcs";
import type { RootState } from "_redux/RootReducer";
import type { AppThunkConfig } from "_store/thunk-extras";
import { SignerBridge } from "_src/ui/app/UiBridge/SignerBridge";
import { TransactionBlock } from "_src/xdag/typescript/builder";

// 简化后的交易状态类型
export type TransactionStatus = 'idle' | 'loading' | 'success' | 'failed';

// 定义实体类型
export interface TransactionEntity extends XDagTransactionBlockResponse {
	createdDate: string;
	id: string;
	status: TransactionStatus;
	errorInfo?: string;
	txResponse?: XDagTransactionBlockResponse | SignedMessage;
}

// createEntityAdapter
const transactionsAdapter = createEntityAdapter<TransactionEntity>({
	sortComparer: (a, b) => new Date(a.createdDate).getTime() - new Date(b.createdDate).getTime(),
});

export const transactionBusiness = createAsyncThunk<
	{ txResponse: XDagTransactionBlockResponse | SignedMessage | undefined; id: string },
	{ tx: TransactionBlock; approved: boolean; signerBridge: SignerBridge; id: string },
	AppThunkConfig
>(
	"transaction/business",
	async ({ tx, approved, signerBridge, id }, { extra: { uiBridge }, rejectWithValue }) => {
		if (!tx || !tx.blockData.sender || !tx.blockData.nonce) {
			return rejectWithValue("Invalid transaction");
		}
		let txSigned: string | undefined = undefined;
		let txResult: XDagTransactionBlockResponse | undefined = undefined;
		let txResultError: string | undefined;
		if (approved) {
			try {
				const h = await tx.buildPart();
				if(!h) {
					throw new Error("buildPart error in transactionBusiness");
				}
				txSigned = await signerBridge.signData(h);
				const signData = await tx.buildFinally(fromHEX(txSigned));
				const response = await uiBridge.rpcBridge.provider.executeSendRawTransaction(tx, signData);
				txResult = response;
			} catch (error) {
				txResultError = getSignerOperationErrorMessage(error);
				return rejectWithValue(txResultError);
			}
		}
		return { txResponse: txResult, id };
	}
);

// Slice
const slice = createSlice({
	name: "transactions",
	initialState: transactionsAdapter.getInitialState({ initialized: false }),
	reducers: {
		setTransactions: (state, { payload }: PayloadAction<TransactionEntity[]>) => {
			transactionsAdapter.setAll(state, payload);
			state.initialized = true;
		},
		cancelTransaction: (state, { payload }: PayloadAction<string>) => {
			transactionsAdapter.updateOne(state, {
				id: payload,
				changes: { status: 'idle', errorInfo: '交易已取消' },
			});
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(transactionBusiness.pending, (state, action) => {
				console.log('transactionBusiness.pending', action);
				const id = action.meta.arg.id;
				transactionsAdapter.updateOne(state, {
					id,
					changes: { status: 'loading', errorInfo: undefined },
				});
			})
			.addCase(transactionBusiness.fulfilled, (state, { payload }) => {
				console.log('transactionBusiness.fulfilled', payload);
				if (payload && payload.id) {
					transactionsAdapter.updateOne(state, {
						id: payload.id,
						changes: { 
							status: 'success', 
							errorInfo: undefined,
							txResponse: payload.txResponse 
						},
					});
				}
			})
			.addCase(transactionBusiness.rejected, (state, action) => {
				console.log('transactionBusiness.rejected', action);
				const id = action.meta.arg.id;
				transactionsAdapter.updateOne(state, {
					id,
					changes: { status: 'failed', errorInfo: action.payload as string },
				});
			});
	},
});

export default slice.reducer;
export const { setTransactions, cancelTransaction } = slice.actions;
export const transactionsSelectors = transactionsAdapter.getSelectors<RootState>(
    (state: RootState) => state.transactions
);
