import mitt from "mitt";
import Browser from "webextension-polyfill";
import { DEFAULT_API_ENV, ENV_TO_API } from "_src/ui/app/UiBridge/RpcBridge";
import { API_ENV } from "_src/shared/api-env";
import { isValidUrl } from "_src/shared/utils";

export type NetworkEnvType = {
  env: API_ENV;
  fullNode: string;
};

class NetworkEnv {
  #events = mitt<{ changed: NetworkEnvType }>();

  async getActiveNetwork(): Promise<NetworkEnvType> {
    const { Xdag_Env, Xdag_Env_FullNode } = await Browser.storage.local.get({
      Xdag_Env: DEFAULT_API_ENV,
      Xdag_Env_FullNode: null,
    });


    let fullNode = "";
    // 获取当前环境对应的 Connection 对象
    const connection = ENV_TO_API[Xdag_Env as API_ENV];
    // 如果是 customRPC 环境，则使用 Xdag_Env_FullNode 中的 URL
    if (Xdag_Env === API_ENV.customRPC && Xdag_Env_FullNode) {
      fullNode = Xdag_Env_FullNode;
    } else if (connection) {
      // 如果不是 customRPC 环境，则使用对应环境的 fullnode URL
      fullNode = connection.fullnode;
    }

    console.log("...getActiveNetwork fullNode:", fullNode);
    // const adjCustomUrl = Xdag_Env === API_ENV.customRPC ? Xdag_Env_RPC : null;
    return {
      env: Xdag_Env,
      fullNode: fullNode,
    };
  }

  async setActiveNetwork(network: NetworkEnvType) {
    const { env, fullNode } = network;
    if (env === API_ENV.customRPC && !isValidUrl(fullNode)) {
      throw new Error(`Invalid custom RPC url ${fullNode}`);
    }
    await Browser.storage.local.set({
      Xdag_Env: env,
      Xdag_Env_FullNode: fullNode,
    });
    this.#events.emit("changed", network);
  }

  on = this.#events.on;
  off = this.#events.off;
}

const networkEnv = new NetworkEnv();
export default networkEnv;
