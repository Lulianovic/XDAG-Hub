import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CoinActivitiesCard } from "./CoinActivityCard";
import { TokenIconLink } from "./TokenIconLink";
import { TokenLink } from "./TokenLink";
import { TokenList } from "./TokenList";
import CoinBalance from "./coin-balance";
import { useActiveAddress } from "_app/hooks/useActiveAddress";
import { LargeButton } from "_app/shared/LargeButton";
import { Text } from "_app/shared/text";
import {
	Info12,
	WalletActionBuy24,
	WalletActionSend24,
	Swap16,
	Unpin16,
	Pin16,
} from "_assets/icons/tsIcons";
import Alert from "_components/alert";
import Loading from "_components/loading";
import { filterAndSortTokenBalances } from "_helpers";
import { useAppSelector, useCoinsReFetchingConfig } from "_hooks";
import {
	useAppsBackend,
	useGetCoinBalance,
	useGetAllBalances,
} from "_shared/hooks";
import { API_ENV } from "_src/shared/api-env";
import { AccountSelector } from "_src/ui/app/components/AccountSelector";
import { usePinnedCoinTypes } from "_src/ui/app/hooks/usePinnedCoinTypes";
import { useRecognizedPackages } from "_src/ui/app/hooks/useRecognizedPackages";
import PageTitle from "_src/ui/app/shared/PageTitle";
import {
	CoinAPI,
	XDAG_TYPE_ARG,
} from "_src/xdag/typescript/framework";
import type { CoinBalance as CoinBalanceType } from "_src/xdag/typescript/types";
import BigNumber from "bignumber.js";
import { useTranslation } from 'react-i18next';


type TokenDetailsProps = {
	coinType?: string;
};

function PinButton( { unpin, onClick, }: { unpin?: boolean; onClick: () => void; } ) {

	return (
		<button
			type="button"
			className="border-none bg-transparent text-transparent group-hover/coin:text-steel hover:!text-hero cursor-pointer"
			aria-label={ unpin ? "Unpin Coin" : "Pin Coin" }
			onClick={ ( e ) => {
				e.preventDefault();
				e.stopPropagation();
				onClick();
			} }
		>
			{ unpin ? <Unpin16/> : <Pin16/> }
		</button>
	);
}

function MyTokens() {
	const accountAddress = useActiveAddress();
	const apiEnv = useAppSelector( ( { app } ) => app.apiEnv );
	const { staleTime, refetchInterval } = useCoinsReFetchingConfig();
	const { data, isLoading, isFetched } = useGetAllBalances(
		accountAddress,
		staleTime,
		refetchInterval,
		filterAndSortTokenBalances,
	);

	const recognizedPackages = useRecognizedPackages();
	const [ pinnedCoinTypes, { pinCoinType, unpinCoinType } ] = usePinnedCoinTypes();

	const { t } = useTranslation();

	const { recognized, pinned, unrecognized } = useMemo(
		() =>
			data?.reduce(
				( acc, coinBalance ) => {
					if (
						recognizedPackages.includes( coinBalance.coinType.split( "::" )[ 0 ] )
					) {
						acc.recognized.push( coinBalance );
					} else if ( pinnedCoinTypes.includes( coinBalance.coinType ) ) {
						acc.pinned.push( coinBalance );
					} else {
						acc.unrecognized.push( coinBalance );
					}
					return acc;
				},
				{
					recognized: [] as CoinBalanceType[],
					pinned: [] as CoinBalanceType[],
					unrecognized: [] as CoinBalanceType[],
				},
			) ?? { recognized: [], pinned: [], unrecognized: [] },
		[ data, recognizedPackages, pinnedCoinTypes ],
	);

	const noXdagToken = !data?.find( ( { coinType } ) => coinType === XDAG_TYPE_ARG );

	// Avoid perpetual loading state when fetching and retry keeps failing; add isFetched check.
	const isFirstTimeLoading = isLoading && !isFetched;
	return (
		<Loading loading={ isFirstTimeLoading }>
			{ recognized.length > 0 && (
				<TokenList title="My Coins" defaultOpen>
					{ recognized.map( ( coinBalance ) => (
						<TokenLink key={ coinBalance.coinType } coinBalance={ coinBalance }/>
					) ) }
				</TokenList>
			) }

			{ pinned.length > 0 && (
				<TokenList title="Pinned Coins" defaultOpen>
					{ pinned.map( ( coinBalance ) => (
						<TokenLink
							key={ coinBalance.coinType }
							coinBalance={ coinBalance }
							centerAction={
								<PinButton
									unpin
									onClick={ () => {
										unpinCoinType( coinBalance.coinType );
									} }
								/>
							}
						/>
					) ) }
				</TokenList>
			) }

			{ unrecognized.length > 0 && (
				<TokenList
					title={
						unrecognized.length === 1
							? `${ unrecognized.length } Unrecognized Coin`
							: `${ unrecognized.length } Unrecognized Coins`
					}
					defaultOpen={ apiEnv !== API_ENV.mainnet }
				>
					{ unrecognized.map( ( coinBalance ) => (
						<TokenLink
							key={ coinBalance.coinType }
							coinBalance={ coinBalance }
							centerAction={
								<PinButton
									onClick={ () => {
										pinCoinType( coinBalance.coinType );
									} }
								/>
							}
						/>
					) ) }
				</TokenList>
			) }

			{ noXdagToken ? (
				<div className="flex flex-col flex-nowrap justify-center items-center gap-2 text-center mt-6 px-2.5">
					<Text variant="pBodySmall" color="gray-80" weight="normal">
						To conduct transactions on the XDAG network, you need XDAG in your wallet.
					</Text>
				</div>
			) : null }
		</Loading>
	);
}

function TokenDetails( { coinType }: TokenDetailsProps ) {
	const [ interstitialDismissed, setInterstitialDismissed ] = useState<boolean>( false );
	const activeCoinType = coinType || XDAG_TYPE_ARG;
	const accountAddress = useActiveAddress();
	const { staleTime, refetchInterval } = useCoinsReFetchingConfig();
	const {
		data: coinBalance,
		isError,
		isLoading,
		isFetched,
	} = useGetCoinBalance( activeCoinType, accountAddress, refetchInterval, staleTime, );
	const { t } = useTranslation();

	// const { apiEnv } = useAppSelector((state) => state.app);
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

	const tokenBalance = BigNumber( coinBalance?.totalBalance ?? "0" );//|| BigInt(0))

	const coinSymbol = useMemo(
		() => CoinAPI.getCoinSymbol( activeCoinType ),
		[ activeCoinType ],
	);
	// Avoid perpetual loading state when fetching and retry keeps failing add isFetched check
	const isFirstTimeLoading = isLoading && !isFetched;

	useEffect( () => {
		const dismissed = localStorage.getItem( "bullshark-interstitial-dismissed" );
		setInterstitialDismissed( dismissed === "true" );
	}, [] );

	return (
		<>
			{/*{ apiEnv === API_ENV.mainnet && data?.degraded && (*/ }
			{/*  <div className="rounded-2xl bg-warning-light border border-solid border-warning-dark/20 text-warning-dark flex items-center py-2 px-3 mb-4">*/ }
			{/*    <Info12 className="shrink-0" />*/ }
			{/*    <div className="ml-2">*/ }
			{/*      <Text variant="pBodySmall" weight="medium">*/ }
			{/*        We're sorry that the app is running slower than usual. We're*/ }
			{/*        working to fix the issue and appreciate your patience.*/ }
			{/*      </Text>*/ }
			{/*    </div>*/ }
			{/*  </div>*/ }
			{/*)}*/ }

			<Loading loading={ isFirstTimeLoading }>
				{ coinType && <PageTitle title={ coinSymbol } back="/tokens"/> }

				<div
					className="flex flex-col h-full flex-1 flex-grow items-center overflow-y-auto"
					data-testid="coin-page"
				>
					<div className="max-w-full">{ !coinType && <AccountSelector/> }</div>

					<div data-testid="coin-balance" className="mt-1.5">
						<CoinBalance
							balance={ tokenBalance }
							type={ activeCoinType }
							mode="standalone"
						/>
					</div>

					{ isError ? (
						<Alert>
							<div>
								<strong>Error updating balance</strong>
							</div>
						</Alert>
					) : null }

					<div className="flex flex-nowrap gap-3 justify-center w-full mt-5">
						<LargeButton
							center
							to="/onramp"
							// disabled={ (coinType && coinType !== XDAG_TYPE_ARG) || !providers?.length }
							disabled={ false }
							top={ <WalletActionBuy24/> }
						>
							{ t( "TokenDetails.Buy" ) }
						</LargeButton>

						<LargeButton
							center
							data-testid="send-coin-button"
							to={ `/send${ coinBalance?.coinType ? `?${ new URLSearchParams( { type: coinBalance.coinType, } ).toString() }` : "" }` }
							disabled={ !tokenBalance }
							top={ <WalletActionSend24/> }
						>
							{ t( "TokenDetails.Send" ) }
						</LargeButton>

						<LargeButton center to="/" disabled={ true } top={ <Swap16/> }>
							{ t( "TokenDetails.Swap" ) }
						</LargeButton>
					</div>


					<div className="mb-1 text-center">
						<Text variant="pBodySmall" color="steel-dark" weight="normal">
							{ t( "TokenDetails.SuitableForSmallAmount" ) }
						</Text>
					</div>

					{/*{ activeCoinType === XDAG_TYPE_ARG && accountAddress ? (*/ }
					{/*	<div className="mt-6 flex justify-start gap-2 flex-col w-full">*/ }
					{/*		/!*<TokenIconLink accountAddress={ accountAddress }/>*!/*/ }
					{/*	</div>*/ }
					{/*) : null }*/ }
					{ /*
										{ !coinType ? (
						<MyTokens/>
					) : (
						<div className="mt-6 flex-1 justify-start gap-2 flex-col w-full">
							<Text variant="caption" color="steel" weight="semibold">
								{ coinSymbol } activity
							</Text>
							<div className="flex flex-col flex-nowrap flex-1">
								<CoinActivitiesCard coinType={ activeCoinType }/>
							</div>
						</div>
					) }
						 */
					}


				</div>
			</Loading>
		</>
	);
}

export default TokenDetails;
