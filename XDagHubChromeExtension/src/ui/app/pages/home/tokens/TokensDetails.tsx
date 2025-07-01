import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CoinActivitiesCard } from "./CoinActivityCard";
import { TokenIconLink } from "./TokenIconLink";
import { TokenLink } from "./TokenLink";
import { TokenList } from "./TokenList";
import CoinBalance from "./coin-balance";
import FaucetComponent from "./FaucetComponent";
import { useActiveAddress } from "_app/hooks/useActiveAddress";
import { LargeButton } from "_app/shared/LargeButton";
import { Text } from "_app/shared/text";
import {
	WalletActionBuy24,
	WalletActionSend24,
	Swap16,
} from "_assets/icons/tsIcons";
import Alert from "_components/alert";
import Loading from "_components/loading";
import { useAppSelector, useCoinsReFetchingConfig } from "_hooks";
import {
	useGetCoinBalance,
} from "_shared/hooks";
import { API_ENV } from "_src/shared/api-env";
import { AccountSelector } from "_src/ui/app/components/AccountSelector";
import PageTitle from "_src/ui/app/shared/PageTitle";
import {
	CoinAPI,
	XDAG_TYPE_ARG,
} from "_src/xdag/typescript/framework";
import BigNumber from "bignumber.js";
import { useTranslation } from 'react-i18next';


type TokenDetailsProps = {
	coinType?: string;
};


function TokenDetails({ coinType }: TokenDetailsProps) {
	const [interstitialDismissed, setInterstitialDismissed] = useState<boolean>(false);
	const activeCoinType = coinType || XDAG_TYPE_ARG;
	const accountAddress = useActiveAddress();
	const { staleTime, refetchInterval } = useCoinsReFetchingConfig();
	const {
		data: coinBalance,
		isError,
		isLoading,
		isFetched,
	} = useGetCoinBalance(activeCoinType, accountAddress, refetchInterval, staleTime,);
	const { t } = useTranslation();

	const { apiEnv } = useAppSelector((state) => state.app);
	// const { request } = useAppsBackend();
	// const { data } = useQuery({
	//   queryKey: ["apps-backend", "monitor-network"],
	//   queryFn: () => request<{ degraded: boolean }>("monitor-network", { project: "WALLET" }),
	//   // Keep cached for 2 minutes:
	//   staleTime: 2 * 60 * 1000,
	//   retry: false,
	//   enabled: apiEnv === API_ENV.mainnet,
	// });

	// useLedgerNotification(!BullsharkInterstitialEnabled || interstitialDismissed);

	const tokenBalance = BigNumber(coinBalance?.totalBalance ?? "0");//|| BigInt(0))

	const coinSymbol = useMemo(
		() => CoinAPI.getCoinSymbol(activeCoinType),
		[activeCoinType],
	);
	// Avoid perpetual loading state when fetching and retry keeps failing add isFetched check
	const isFirstTimeLoading = isLoading && !isFetched;

	useEffect(() => {
		const dismissed = localStorage.getItem("bullshark-interstitial-dismissed");
		setInterstitialDismissed(dismissed === "true");
	}, []);

	return (
		<>
			{/*{ apiEnv === API_ENV.mainnet && data?.degraded && (*/}
			{/*  <div className="rounded-2xl bg-warning-light border border-solid border-warning-dark/20 text-warning-dark flex items-center py-2 px-3 mb-4">*/}
			{/*    <Info12 className="shrink-0" />*/}
			{/*    <div className="ml-2">*/}
			{/*      <Text variant="pBodySmall" weight="medium">*/}
			{/*        We're sorry that the app is running slower than usual. We're*/}
			{/*        working to fix the issue and appreciate your patience.*/}
			{/*      </Text>*/}
			{/*    </div>*/}
			{/*  </div>*/}
			{/*)}*/}

			<Loading loading={isFirstTimeLoading}>
				{coinType && <PageTitle title={coinSymbol} back="/tokens" />}

				<div className="flex flex-col h-full flex-1 flex-grow items-center overflow-y-auto"
					data-testid="coin-page"
				>
					<div className="max-w-full">{!coinType && <AccountSelector />}</div>

					<div data-testid="coin-balance" className="mt-1.5">
						<CoinBalance
							balance={tokenBalance}
							type={activeCoinType}
							mode="standalone"
						/>
					</div>

					{isError ? (
						<Alert>
							<div>
								<strong>Error updating balance</strong>
							</div>
						</Alert>
					) : null}

					<div className="flex flex-nowrap gap-3 justify-center w-full mt-5">
						<LargeButton
							center
							to="/onramp"
							disabled={apiEnv !== API_ENV.mainnet}
							top={<WalletActionBuy24 />}
						>
							{t("TokenDetails.Buy")}
						</LargeButton>
						<LargeButton
							center
							data-testid="send-coin-button"
							to={`/send${coinBalance?.coinType ? `?${new URLSearchParams({ type: coinBalance.coinType, }).toString()}` : ""}`}
							disabled={!tokenBalance}
							top={<WalletActionSend24 />}
						>
							{t("TokenDetails.Send")}
						</LargeButton>
						<LargeButton center to="/" disabled={true} top={<Swap16 />}>
							{t("TokenDetails.Swap")}
						</LargeButton>
					</div>


					{/* <div className="mb-1 text-center">
						<Text variant="pBodySmall" color="steel-dark" weight="normal">
							{t("TokenDetails.SuitableForSmallAmount")}
						</Text>
					</div> */}

					{
						apiEnv === API_ENV.testNet && (
							<>
								<FaucetComponent />
							</>
						)
					}


				</div>
			</Loading>
		</>
	);
}

export default TokenDetails;
