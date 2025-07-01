import { createAsyncThunk, createEntityAdapter, createSlice, } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "_redux/RootReducer";
import type { AppThunkConfig } from "_store/thunk-extras";
import { InscriptionApprovalRequest } from "_src/shared/messaging/messages/payloads/inscription";
import { selectCurInscChunks, selectCurInscRequest, setCurInscResponse } from "../curInscriptionRequestSlice";
import { SignerBridge } from "_src/ui/app/UiBridge/SignerBridge";

const inscRequestsAdapter = createEntityAdapter<InscriptionApprovalRequest>({
	sortComparer: (a, b) => {
		const aDate = new Date(a.createdDate);
		const bDate = new Date(b.createdDate);
		return aDate.getTime() - bDate.getTime();
	},
});

export const respondToInscriptionRequest = createAsyncThunk<
	{},
	{ inscRequestID: string; approved: boolean; signer: SignerBridge; clientIdentifier?: string; },
	AppThunkConfig
>(
	"respond-to-inscription-request",
	async ({ inscRequestID, approved, signer, clientIdentifier }, {dispatch, extra: { background }, getState },) => {

		let txResult: string[] | undefined = [];
		let txResultError: string | undefined;

		const state = getState();
		const inscRequest = selectCurInscRequest(state);
		const inscChunks = selectCurInscChunks(state);
		// console.log("TEST:::::::>>>\n, inscRequest, chunkResult:\n", inscRequest, chunkResult);

		if (!approved) {
			throw new Error(`approval is false`,);
		}

		// try {
		// 	if (inscRequest && inscRequest?.inscription && inscChunks && inscRequestID === inscRequest.id) {
		// 		const chunks = inscChunks.chunks;
		// 		const toAddress = inscRequest?.inscription?.toAddress;
		// 		const amount = inscChunks.singleTxCost;
		// 		const promises = chunks.map(async (chunkString) => {
		// 			const tx = createXDagTransferTransactionBlock(toAddress!, amount, chunkString);
		// 			const txResultId = signer.signTransaction(tx);
		// 			return txResultId;
		// 		});
		// 		const txResultIds = await Promise.all(promises);
		// 		txResult = txResultIds.filter(result => result !== undefined).map(item=>item.address); // Filter out undefined results
		// 	} else {
		// 		throw new Error(`Unexpected inscRequest or chunkResult`,);
		// 	}
		// } catch (error) {
		// 	throw new Error(`approval error`,);
		// }

		background.sendInscriptionRequestResponse(inscRequestID, approved, txResult, txResultError);
		const inscResponse = {
			inscRequestID, approved: approved, inscResponse: txResult 
		}
		dispatch(setCurInscResponse(inscResponse));
		return inscResponse;
	},
);


const slice = createSlice({
	name: "transaction-requests",
	initialState: inscRequestsAdapter.getInitialState({
		initialized: false,
	}),
	reducers: {
		setInscriptionRequests: (state, { payload }: PayloadAction<InscriptionApprovalRequest[]>,) => {
			inscRequestsAdapter.setAll(state, payload);
			state.initialized = true;
		},
	},
	extraReducers: (build) => {
		build.addCase(
			respondToInscriptionRequest.fulfilled,
			(state, { payload }) => {
				// const { inscRequestID, approved: allowed, inscResponse } = payload;
				// txRequestsAdapter.updateOne(state, {
				// 	id: txRequestID,
				// 	changes: {
				// 		approved: allowed,
				// 		txResult: txResponse || undefined,
				// 	},
				// });
			},
		);
	},
});

export default slice.reducer;
export const { setInscriptionRequests } = slice.actions;

export const inscRequestsSelectors = inscRequestsAdapter.getSelectors(
	(state: RootState) => state.inscriptionRequests,
);
