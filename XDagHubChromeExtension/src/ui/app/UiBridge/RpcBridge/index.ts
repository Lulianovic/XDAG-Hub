import { queryClient } from "_app/helpers/queryClient";
import { API_ENV } from "_shared/api-env";
import { Connection, JsonRpcProvider, localnetConnection, mainnetConnection, testnetConnection } from "_src/xdag/typescript/rpc";

type EnvInfo = {
	name: string;
	env: API_ENV;
};

export const API_ENV_TO_INFO: Record<API_ENV, EnvInfo> = {
	[API_ENV.local]: { name: "Local", env: API_ENV.local },
	// [API_ENV.devNet]: { name: "Devnet", env: API_ENV.devNet },
	[API_ENV.customRPC]: { name: "Custom RPC", env: API_ENV.customRPC },
	[API_ENV.testNet]: { name: "Testnet", env: API_ENV.testNet },
	[API_ENV.mainnet]: { name: "Mainnet", env: API_ENV.mainnet },
};


export const ENV_TO_API: Record<API_ENV, Connection | null> = {
	[API_ENV.customRPC]: null,
	[API_ENV.local]: localnetConnection,
	[API_ENV.testNet]: testnetConnection,
	[API_ENV.mainnet]: mainnetConnection,
};


export function getDefaultApiEnv() {
	const apiEnv = process.env.API_ENV;
	if (apiEnv && !Object.keys(API_ENV).includes(apiEnv)) {
		throw new Error(`Unknown environment variable API_ENV, ${apiEnv}`);
	}
	return apiEnv ? API_ENV[apiEnv as keyof typeof API_ENV] : API_ENV.mainnet;
}

export function getConnectionAPI(env: API_ENV) {
	const apiNode = ENV_TO_API[env];
	if (!apiNode || apiNode.fullnode === "") {
		throw new Error(`API endpoint not found for API_ENV ${env}`);
	}
	return apiNode;
}

export const DEFAULT_API_ENV = getDefaultApiEnv();

type NetworkTypes = keyof typeof API_ENV;

export const generateActiveNetworkList = (): NetworkTypes[] => {
	return Object.values(API_ENV);
};

export default class RpcBridge {
    private static _instance: RpcBridge;
    private _apiFullNodeProvider: JsonRpcProvider;
    private _currentEnv: API_ENV;
    private _customRPC?: string | null;

    private constructor() {
        this._currentEnv = DEFAULT_API_ENV;
        this._apiFullNodeProvider = this.createProvider(DEFAULT_API_ENV);
    }

    public static get instance(): RpcBridge {
        if (!RpcBridge._instance) {
            RpcBridge._instance = new RpcBridge();
        }
        return RpcBridge._instance;
    }

    private createProvider(apiEnv: API_ENV, customRPC?: string | null) {
        const connection = customRPC 
            ? new Connection({ fullnode: customRPC })
            : getConnectionAPI(apiEnv);
        return new JsonRpcProvider(connection);
    }

    public updateProvider(apiEnv: API_ENV, customRPC?: string | null) {
        if (apiEnv !== this._currentEnv || customRPC !== this._customRPC) {
            this._apiFullNodeProvider = this.createProvider(apiEnv, customRPC);
            this._currentEnv = apiEnv;
            this._customRPC = customRPC;
            queryClient.resetQueries();
            queryClient.clear();
        }
    }

    public get provider() {
        return this._apiFullNodeProvider;
    }
}
