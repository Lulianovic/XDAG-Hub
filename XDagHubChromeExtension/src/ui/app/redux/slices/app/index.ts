import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { AppType } from "./AppType";
import { DEFAULT_API_ENV } from "_src/ui/app/UiBridge/RpcBridge";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "_redux/RootReducer";
import type { NetworkEnvType } from "_src/background/NetworkEnv";
import type { API_ENV } from "_src/shared/api-env";
import type { AppThunkConfig } from "_store/thunk-extras";

type AppState = {
	appType: AppType;
	apiEnv: API_ENV;
	navVisible: boolean;
	fullNode?: string | null;
	activeOrigin: string | null;
	activeOriginFavIcon: string | null;
	pendingTransactionBlock: string | null;
};

const initialState: AppState = {
	appType: AppType.unknown,
	apiEnv: DEFAULT_API_ENV,
	fullNode: null,
	navVisible: true,
	activeOrigin: null,
	activeOriginFavIcon: null,
	pendingTransactionBlock: null,
};

export const changeActiveNetwork = createAsyncThunk<
	void,
	{ network: NetworkEnvType; store?: boolean },
	AppThunkConfig
>(
	"changeRPCNetwork",
	async ({ network, store = false }, { extra: { background, uiBridge }, dispatch },) => {
		if (store) {
			await background.setActiveNetworkEnv(network);
		}
		uiBridge.rpcBridge.updateProvider(network.env, network.fullNode);
		await dispatch(slice.actions.setActiveNetwork(network));
	},
);

const slice = createSlice({
	name: "app",
	reducers: {
		initAppType: (state, { payload }: PayloadAction<AppType>) => {
			state.appType = payload;
		},
		setActiveNetwork: (
			state,
			{ payload: { env, fullNode } }: PayloadAction<NetworkEnvType>,
		) => {
			state.apiEnv = env;
			state.fullNode = fullNode;
		},
		setNavVisibility: (
			state,
			{ payload: isVisible }: PayloadAction<boolean>,
		) => {
			state.navVisible = isVisible;
		},
		setActiveOrigin: (
			state,
			{
				payload,
			}: PayloadAction<{ origin: string | null; favIcon: string | null }>,
		) => {
			state.activeOrigin = payload.origin;
			state.activeOriginFavIcon = payload.favIcon;
		},
		setPendingTransactionBlock: (
			state,
			{ payload: { blockAddress } }: PayloadAction<{ blockAddress: string | null }>,
		) => {
			state.pendingTransactionBlock = blockAddress;
		},
	},
	initialState,
});

export const { initAppType, setNavVisibility, setActiveOrigin, setPendingTransactionBlock } = slice.actions;
export const getNavIsVisible = ({ app }: RootState) => app.navVisible;
export const getApiEnv = ({ app }: RootState) => app.apiEnv;

export default slice.reducer;
