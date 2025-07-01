
import { BackgroundBridge } from "./BackgroundBridge";
import RpcBridge from "./RpcBridge";
import { SignerBridge } from "./SignerBridge";

export default class UiBridge {
    private static _instance: UiBridge;
    private _backgroundBridge: BackgroundBridge;
    private _rpcBridge: RpcBridge;


    private constructor() {
        this._backgroundBridge = BackgroundBridge.instance;
        this._rpcBridge = RpcBridge.instance;
    }

    public static get instance(): UiBridge {
        if (!UiBridge._instance) {
            UiBridge._instance = new UiBridge();
        }
        return UiBridge._instance;
    }

    public get backgroundBridge(): BackgroundBridge {
        return this._backgroundBridge;
    }

    public get rpcBridge(): RpcBridge {
        return this._rpcBridge;
    }

    public createSignerBridge(address: string): SignerBridge {
        return new SignerBridge(address);
    }
}