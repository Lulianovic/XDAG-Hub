import type { XDagAddress } from "_src/xdag/typescript/types";
import type { SerializedSignature } from "_src/xdag/typescript/cryptography";
import { AccountType, SerializedAccount } from "_src/background/keyring/Account";
import { BackgroundBridge } from "../BackgroundBridge";
import RpcBridge from "../RpcBridge";
import { TransactionBlock } from "_src/xdag/typescript/builder";

export class SignerBridge {
	//交易签名比如复杂，签名中间会使用到与节点交互，也用到插件后台服务申请使用私钥进行签名。
	//所以这些桥接都需要引入。
	readonly #address: XDagAddress;
	readonly #backgroundBridge: BackgroundBridge;
	readonly #rpcBridge: RpcBridge;

	constructor(address: XDagAddress) {
		if (!BackgroundBridge.instance || !RpcBridge.instance) {
			throw new Error("Required bridge instances must be initialized first");
		}
		this.#backgroundBridge = BackgroundBridge.instance;
		this.#rpcBridge = RpcBridge.instance;
		this.#address = address;
	}

	public getSignerBrideInstance(account: SerializedAccount): SignerBridge {
		switch (account.type) {
			case AccountType.DERIVED:
			case AccountType.IMPORTED:
				return new SignerBridge(account.address);
			default:
				throw new Error("Encountered unknown account type");
		}
	}

	signData( data: string ): Promise<SerializedSignature> {
		return this.#backgroundBridge.signData( this.#address, data );
	}

	// signTransaction( transaction: TransactionBlock ): Promise<SerializedSignature> {
	// 	// return this.#backgroundBridge.signTransaction( this.#address, transaction );
	// 	return new Promise((resolve) => {
	// 		resolve(""); 
	// 	});
	// }


}
