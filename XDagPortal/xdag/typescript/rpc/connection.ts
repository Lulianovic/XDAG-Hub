
interface ConnectionOptions {
  fullnode: string;
  websocket?: string;
}

export class Connection {
  #options: ConnectionOptions;

  constructor(options: ConnectionOptions) {
    this.#options = options;
  }

  get fullnode() {
    return this.#options.fullnode;
  }

  get websocket() {
    return this.#options.websocket || this.#options.fullnode;
  }

}

export const localnetConnection = new Connection({
  fullnode:  process.env.API_ENDPOINT_LOCAL_FULLNODE || "",
});

export const testnetConnection = new Connection({
  fullnode:  process.env.API_ENDPOINT_TEST_NET_FULLNODE || "",
});

export const mainnetConnection = new Connection({
  fullnode:  process.env.API_ENDPOINT_MAINNET_FULLNODE || "",
});


