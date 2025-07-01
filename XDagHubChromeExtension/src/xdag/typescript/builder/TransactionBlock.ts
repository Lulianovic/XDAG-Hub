import { API_ENV } from "_src/shared/api-env";
import { TransactionBlockDataBuilder } from "./TransactionBlockData";



export class TransactionBlock {
	#blockData: TransactionBlockDataBuilder;

	constructor(transaction?: TransactionBlock) {
		this.#blockData = new TransactionBlockDataBuilder(transaction ? transaction.blockData : undefined,);
	}

	get blockData() {
		return this.#blockData;
	}

	get version() {
		return this.#blockData.version;
	}
	setVersion(version: 1) {
		this.#blockData.version = version;
	}

	get sender() {
		return this.#blockData.sender;
	}
	setSender(sender: string) {
		this.#blockData.sender = sender;
	}

	get receiver() {
		return this.#blockData.receiver;
	}
	setReceiver(receiver: string) {
		this.#blockData.receiver = receiver;
	}

	get amount() {
		return this.#blockData.amount;
	}
	setAmount(amount: string) {
		this.#blockData.amount = amount;
	}

	get nonce() {
		return this.#blockData.nonce;
	}
	setNonce(nonce: string) {
		this.#blockData.nonce = nonce;
	}

	get networkEnv() {
		return this.#blockData.networkEnv;
	}
	setNetworkEnv(networkEnv: API_ENV) {
		this.#blockData.networkEnv = networkEnv;
	}

	get publicKey() {
		return this.#blockData.publicKey;
	}
	setPublicKey(publicKey: string | undefined) {
		this.#blockData.publicKey = publicKey;
	}

	get remark() {
		return this.#blockData.remark;
	}
	setRemark(remark: string) {
		this.#blockData.remark = remark;
	}

	get preBuildStr() {
		return this.#blockData.preBuildStr;
	}
	setPreBuildStr(preBuildStr: string) {
		this.#blockData.preBuildStr = preBuildStr;
	}

	get preBuildHash() {
		return this.#blockData.preBuildHash;
	}
	setPreBuildHash(preBuildHash: string) {
		this.#blockData.preBuildHash = preBuildHash;
	}

	get wholeBuildStr() {
		return this.#blockData.wholeBuildStr;
	}
	setWholeBuildStr(wholeBuildStr: string) {
		this.#blockData.wholeBuildStr = wholeBuildStr;
	}

	async buildPart(): Promise<string | undefined> {
		return this.#blockData.buildPart();
	}

	async buildFinally(signedHash: Uint8Array): Promise<string> {
		return this.#blockData.buildFinally(signedHash);
	}

	serialize() {
		return JSON.stringify(this.#blockData.serialize());
	}
}
