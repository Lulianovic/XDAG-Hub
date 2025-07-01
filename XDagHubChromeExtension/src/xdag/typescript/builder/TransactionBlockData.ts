import { Infer, enums, define, integer, is, literal, nullable, object, optional, string, union, } from "superstruct";
import BigNumber from "bignumber.js";
import { checkBase58Address, getCurrentTimestamp, xDag2Amount } from "./xdagBuilderHelper";
import { fromB64, fromHEX, toHEX } from "_src/xdag/bcs";
import { sha256 } from "@noble/hashes/sha2";
import { API_ENV } from "_src/shared/api-env";


export const TransactionExpiration = optional(
	nullable(
		union([
			object({ Epoch: integer() }),
			object({ None: union([literal(true), literal(null)]) }),
		]),
	),
);
export type TransactionExpiration = Infer<typeof TransactionExpiration>;

const XDagAddress = string();
const StringEncodedBigint = define<string>("StringEncodedBigint", (val) => {
	if (!["string", "number", "bigint"].includes(typeof val)) return false;
	try {
		BigInt(val as string);
		return true;
	} catch {
		return false;
	}
});


export const SerializedTransactionDataBuilder = object({
	version: literal(1),
	sender: optional(XDagAddress),
	receiver: optional(XDagAddress),
	amount: optional(StringEncodedBigint),
	nonce: optional(string()),
	publicKey: optional(string()),
	remark: optional(string()),
	preBuildStr: optional(string()),
	preBuildHash: optional(string()),
	wholeBuildStr: optional(string()),
	networkEnv: enums(Object.values(API_ENV))
});
export type SerializedTransactionDataBuilder = Infer<typeof SerializedTransactionDataBuilder>;

export class TransactionBlockDataBuilder {
	version = 1 as const;
	sender: string | undefined;
	receiver: string | undefined;
	amount: string | undefined;
	nonce: string | undefined;
	publicKey: string | undefined;
	remark?: string | undefined;
	//交易块不支持临时变更上面的关键元素
	preBuildStr: string | undefined;
	preBuildHash: string | undefined;
	wholeBuildStr: string | undefined;
	networkEnv: API_ENV;

	//测试网有 nonce，奇数公钥，无 remark
	hasNonceOddKeyNoRemarkTest: string = "e8dc570500000000";//小端：0557dce8
	//测试网有 nonce，偶数公钥，无 remark
	hasNonceEvenKeyNoRemarkTest: string = "e8dc560500000000";//小端：0556dce8
	//测试网有 nonce，奇数公钥，有 remark
	hasNonceOddKeyHasRemarkTest: string = "e8dc795500000000";//小端：5579dce8
	//测试网有 nonce，偶数公钥，有 remark
	hasNonceEvenKeyHasRemarkTest: string = "e8dc695500000000";//小端：5569dce8
	//主网======================
	//有 nonce，奇数公钥，无 remark
	hasNonceOddKeyNoRemark: string = "e1dc570500000000";//小端：0557dce1
	//有 nonce，偶数公钥，无 remark
	hasNonceEvenKeyNoRemark: string = "e1dc560500000000";//小端：0556dce1
	//有 nonce，奇数公钥，有 remark
	hasNonceOddKeyHasRemark: string = "e1dc795500000000";//小端：5579dce1
	//有 nonce，偶数公钥，有 remark
	hasNonceEvenKeyHasRemark: string = "e1dc695500000000";//小端：5569dce1
	//======================

	constructor(clone?: SerializedTransactionDataBuilder) {
		this.sender = clone?.sender;
		this.receiver = clone?.receiver;
		this.amount = clone?.amount;
		this.nonce = clone?.nonce;
		this.publicKey = clone?.publicKey;
		this.remark = clone?.remark;
		this.preBuildStr = clone?.preBuildStr;
		this.preBuildHash = clone?.preBuildHash;
		this.wholeBuildStr = clone?.wholeBuildStr;
		this.networkEnv = clone?.networkEnv ?? API_ENV.mainnet;
	}

	getPublicKey() {
		if (!this.publicKey) {
			throw new Error('Public key is not set');
		}
		return this.publicKey;
	}


	serialize(): string {
		return JSON.stringify({
			version: this.version,
			sender: this.sender,
			receiver: this.receiver,
			amount: this.amount,
			nonce: this.nonce,
			publicKey: this.publicKey,
			remark: this.remark,
			preBuildStr: this.preBuildStr,
			wholeBuildStr: this.wholeBuildStr,
			preBuildHash: this.preBuildHash,
			networkEnv: this.networkEnv,
		});
	}


	/**
	 * 返回的是需要使用私钥进行签名的字符串
	 */
	buildPart(): string | undefined {
		if (!this.sender || !this.receiver || !this.amount || !this.nonce || !this.publicKey) {
			console.log("buildPart error:", this);
			throw new Error("Missing transaction data");
		}
		this.remark = this.remark ?? "".trim();
		// 检查公钥是否为偶数 当前公钥是 base64 编码的字符串，需要先解码为字节数组，然后取第一个字节判断奇偶性
		const pubKeyBytes = fromB64(this.getPublicKey());
		console.log("pubKeyBytes:", pubKeyBytes);
		let isPubKeyEven: boolean = pubKeyBytes[0] % 2 === 0;
		console.log("isPubKeyEven:", isPubKeyEven);

		let from = checkBase58Address(this.sender);
		let to = checkBase58Address(this.receiver);

		const remarkBytes: Uint8Array = new Uint8Array(32);
		if (this.remark !== '') {
			const encoder = new TextEncoder();
			let remarkBytesList = encoder.encode(this.remark);
			if (remarkBytesList.length > 32) {
				console.log("remark will be slice from ", remarkBytesList.length, " to 32");
				remarkBytesList = remarkBytesList.slice(0, 32);
			}
			remarkBytes.set(remarkBytesList);
		}

		//amount
		const transVal: bigint = xDag2Amount(BigNumber(this.amount).toNumber());
		const valBytes: Uint8Array = new Uint8Array(8);
		new DataView(valBytes.buffer).setBigUint64(0, transVal, true);

		//time stamp
		const t: bigint = getCurrentTimestamp();
		const timeBytes: Uint8Array = new Uint8Array(8);
		new DataView(timeBytes.buffer).setBigUint64(0, t, true);

		// field 00: header 会根据是否有remark来添加不同数量的padding zeros
		this.preBuildStr = '0000000000000000';
		//在代码中是区分主网测试网的。但是在社区部署的测试节点中没有区分。
		//让this.networkEnv 一直为 API_ENV.mainnet
		this.networkEnv = API_ENV.mainnet
		if (this.networkEnv === API_ENV.mainnet) {
			if (this.remark.length > 0) {
				this.preBuildStr += (isPubKeyEven ? this.hasNonceEvenKeyHasRemark : this.hasNonceOddKeyHasRemark);
			} else {
				this.preBuildStr += (isPubKeyEven ? this.hasNonceEvenKeyNoRemark : this.hasNonceOddKeyNoRemark);
			}
		} else {
			if (this.remark.length > 0) {
				this.preBuildStr += (isPubKeyEven ? this.hasNonceEvenKeyHasRemarkTest : this.hasNonceOddKeyHasRemarkTest);
			} else {
				this.preBuildStr += (isPubKeyEven ? this.hasNonceEvenKeyNoRemarkTest : this.hasNonceOddKeyNoRemarkTest);
			}
		}
		this.preBuildStr += toHEX(timeBytes);
		this.preBuildStr += "0000000000000000";
		console.log('field01 header:', this.preBuildStr);


		//field 01 transaction nonce
		// nonce：前面补 48 个 0，后面 8 字节小端序存放
		// 前 24 字节（48 个 hex 字符）补 0, 后面 8 字节小端序存放（共16个hex字符）
		const nonceBytes = new Uint8Array(8);
		//DataView.setBigUint64() 方法会改变底层的 ArrayBuffer 内容，从而也会改变 nonceBytes 的内容。
		//其中true 表示小端序，大在部分CPU都是小端序。
		new DataView(nonceBytes.buffer).setBigUint64(0, BigInt(this.nonce), true);
		this.preBuildStr += '0'.repeat(48) + toHEX(nonceBytes);

		//field 02 input
		//from
		this.preBuildStr += from;
		//amount
		this.preBuildStr += toHEX(Buffer.from(valBytes));

		//field 03 output
		//to
		this.preBuildStr += to;
		//amount
		this.preBuildStr += toHEX(Buffer.from(valBytes));

		//field 04 remark
		//remark
		if (this.remark !== '') {
			this.preBuildStr += toHEX(Buffer.from(remarkBytes));
		}


		//field 05  publickey
		//Secp256k1类型的公钥的第1个字节是0x04，不需要添加
		this.preBuildStr += toHEX(fromB64(this.getPublicKey()).slice(1));

		//fileds 06: 签名R部分
		//fileds 07: 签名R部分

		//fields 0*-15 为全0， 一共必须凑齐16个field
		// 准备签名的字符串
		let signStr = this.preBuildStr;
		// 根据是否有remark来添加不同数量的padding zeros
		if (this.remark.length > 0) {
			//有reamark，需要补
			for (let i = 0; i < (16 - 6); i++) {
				signStr += "0000000000000000000000000000000000000000000000000000000000000000";
			}
		} else {
			for (let i = 0; i < (16 - 5); i++) {
				signStr += "0000000000000000000000000000000000000000000000000000000000000000";
			}
		}

		//额外一行: 签名字符串添加公钥====签名的数据除了上面的16个field ,最后还需要再一次包括公钥在最后。 
		//这个publickey不能slice
		const publicKeyHex = toHEX(fromB64(this.getPublicKey()));
		signStr += publicKeyHex;
		this.logLongStr('whole prebuildStr with extra pubkey:\n', signStr);

		// 计算双重SHA256哈希
		const dataBytes = fromHEX(signStr);
		const firstHash = sha256(dataBytes);
		const finallyHash = sha256(firstHash);
		// 添加字节反转操作
		// const reversedHash = finallyHash.reverse();
		this.preBuildHash = toHEX(finallyHash);
		this.logLongStr("Hash:", this.preBuildHash);
		return this.preBuildHash;
	}


	/**
	 * 对私钥签名后的数据进行拼接
	 */
	buildFinally(signedHash: Uint8Array): string {
		const r = toHEX(signedHash.slice(0, 32));
		const s = toHEX(signedHash.slice(32, 64));

		this.wholeBuildStr = this.preBuildStr + r + s;
		// 修改最终填充的字节数
		if (this.remark?.length ?? 0 > 0) {
			for (var i = 0; i < (16 - 8); i++) {
				this.wholeBuildStr += "0000000000000000000000000000000000000000000000000000000000000000";
			}
		} else {
			for (var i = 0; i < (16 - 7); i++) {
				this.wholeBuildStr += "0000000000000000000000000000000000000000000000000000000000000000";
			}
		}
		this.logLongStr("wholeTxHex:", this.wholeBuildStr);
		return this.wholeBuildStr;
	}

	logLongStr = (prefix: string, str: string) => {
		console.log(prefix, "\n");
		for (let i = 0; i < Math.ceil(str.length / 64); i++) {
			console.log(i, "-", str.substring(i * 64, Math.min((i + 1) * 64, str.length)));
		}
	}

}