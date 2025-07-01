import { useNavigate } from "react-router-dom";
import Overlay from "_src/ui/app/components/overlay";
import { Heading } from "_src/ui/app/shared/heading";
import { mexcImg, xtImg, bitImg } from "_assets/png"  // 添加bitexchImg导入
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Text } from "_app/shared/text";
import { useGetExchagePrice } from "_app/hooks/useGetExchangePrice";

/**
 * onramp:  means the door of this area, The onramp from fiat currency to blockchain-based cryptocurrencies.
 * @constructor
 */

export function Onramp() {
	const navigate = useNavigate();
	const { t } = useTranslation();

	// 添加mexc.com的API调用
	const mexcChangeXDagUsdt = "https://api.mexc.com/api/v3/trades?symbol=XDAGUSDT";
	const mexcApiData = useGetExchagePrice(mexcChangeXDagUsdt)
	const [mexcDeal, setMexcDeal] = useState<{ price: string | undefined, type: string | undefined, amount: string | undefined }>();
	useEffect(() => {
		try {
			let dealData = (mexcApiData as any)[0];
			if (dealData) {
				setMexcDeal({ price: dealData.price, type: dealData.tradeType, amount: dealData.qty })
			}
		} catch (e) {
			console.error("error in query mexcApiData")
		}
	}, [mexcApiData])

	// 添加XT.com的API调用
	const xtChangeXDagUsdt = "https://sapi.xt.com/v4/public/ticker/24h?symbol=xdag_usdt";
	const xtApiData = useGetExchagePrice(xtChangeXDagUsdt)
	const [xtDeal, setXtDeal] = useState<{ price: string | undefined, change: string | undefined, volume: string | undefined }>();
	useEffect(() => {
		try {
			let dealData = (xtApiData as any)?.result?.[0];
			if (dealData) {
				setXtDeal({ price: dealData.c, change: dealData.cr, volume: dealData.v })
			}
		} catch (e) {
			console.error("error in query xtApiData")
		}
	}, [xtApiData])


	// 修改bitexch.io的API调用为正确的现货API
	const bitexchBtcUsdt = 'https://betaspot-api.bitexch.dev/spot/v1/market/summary?quote_ccy=USDT';
	const bitexchApiData = useGetExchagePrice(bitexchBtcUsdt)
	const [bitexchDeal, setBitexchDeal] = useState<{ price: string | undefined, change: string | undefined, bid: string | undefined, ask: string | undefined }>();
	useEffect(() => {
		try {
			// 根据market/summary API返回格式修改数据解析
			let dealData = (bitexchApiData as any)?.data;
			if (dealData && Array.isArray(dealData) && dealData.length > 0) {
				// 在数组中查找XDAG-USDT交易对
				const btcUsdtData = dealData.find(item => item.pair === 'XDAG-USDT');
				if (btcUsdtData) {
					// 获取价格数据
					const lastPrice = parseFloat(btcUsdtData.last_price || "0");
					const open24h = parseFloat(btcUsdtData.open24h || "0");
					const priceChange24h = parseFloat(btcUsdtData.price_change24h || "0");
					// 获取买卖盘数据
					const bestBid = parseFloat(btcUsdtData.best_bid || "0");
					const bestAsk = parseFloat(btcUsdtData.best_ask || "0");
					// 计算24小时价格变化百分比
					let priceChange24hPercent = 0;
					if (priceChange24h !== 0) {
						priceChange24hPercent = open24h > 0 ? (priceChange24h / open24h) * 100 : 0;
					} else if (open24h > 0) {
						priceChange24hPercent = ((lastPrice - open24h) / open24h) * 100;
					}
					setBitexchDeal({
						price: lastPrice.toFixed(2),
						change: priceChange24hPercent.toFixed(2),
						bid: bestBid.toFixed(2),
						ask: bestAsk.toFixed(2)
					})
				} else {
					console.warn("XDAG-USDT trading pair not found in API response");
				}
			}
		} catch (e) {
			console.error("error in query bitexchApiData", e)
		}
	}, [bitexchApiData])

	const onClickItem = (url: string) => {
		window.open(url, "_blank");
	}

	return (
		<Overlay
			showModal
			title={t("OnRamp.Buy")}
			closeOverlay={() => { navigate("/tokens"); }}
		>
			<div className="w-full flex-col ">

				<button className="w-full p-6 bg-Xdag/10 rounded-2xl flex items-center border-0 cursor-pointer mb-3.5"
					onClick={() => onClickItem("https://www.mexc.com/exchange/XDAG_USDT")}
				>
					<img src={mexcImg} alt={"Mexc exchange"} style={{ width: '40px', height: '35px' }} />
					<Heading variant="heading6" weight="semibold" color="hero-dark">
						{t("OnRamp.MexcExchange")}
					</Heading>
					<div className=" flex flex-col items-start ml-3 ">
						<Text weight="bold" color={mexcDeal?.type === "ASK" ? "issue-dark" : "success-dark"} mono nowrap>{mexcDeal?.price}</Text>
						<Text weight="bold" color="hero-dark" variant="captionSmall">{mexcDeal?.type} </Text>
						<Text weight="bold" color="hero-dark" variant="captionSmall">{parseInt(mexcDeal?.amount ?? "0")} </Text>
					</div>
				</button>

				{/* 添加XT.com交易所按钮 */}
				<button className="w-full p-6 bg-Xdag/10 rounded-2xl flex items-center border-0 cursor-pointer mb-3.5"
					onClick={() => onClickItem("https://www.xt.com/en/trade/xdag_usdt")}
				>
					<img src={xtImg} alt={"XT exchange"} style={{ width: '40px', height: '35px' }} />
					<Heading variant="heading6" weight="semibold" color="hero-dark">
						{t("OnRamp.XTExchange")}
					</Heading>
					<div className=" flex flex-col items-start ml-3 ">
						<Text weight="bold" color={parseFloat(xtDeal?.change ?? "0") >= 0 ? "success-dark" : "issue-dark"} mono nowrap>{xtDeal?.price}</Text>
						<Text weight="bold" color="hero-dark" variant="captionSmall">{xtDeal?.change}%</Text>
						<Text weight="bold" color="hero-dark" variant="captionSmall">Vol: {parseFloat(xtDeal?.volume ?? "0").toFixed(2)}</Text>
					</div>
				</button>

				{/* 添加bitexch.io交易所按钮 */}
				<button className="w-full p-6 bg-Xdag/10 rounded-2xl flex items-center border-0 cursor-pointer mb-3.5"
					onClick={() => onClickItem("https://www.bitexch.io/spot?pair=BTC-USDT")}
				>
					<img src={bitImg} alt={"Bitexch exchange"} style={{ width: '40px', height: '35px' }} />
					<Heading variant="heading6" weight="semibold" color="hero-dark">
						{t("OnRamp.BitExchange")}
					</Heading>
					<div className=" flex flex-col items-start ml-3 ">
						<Text weight="bold" color={parseFloat(bitexchDeal?.change ?? "0") >= 0 ? "success-dark" : "issue-dark"} mono nowrap>{bitexchDeal?.price}</Text>
						<Text weight="bold" color="hero-dark" variant="captionSmall">{bitexchDeal?.change}%</Text>
						<Text weight="bold" color="hero-dark" variant="captionSmall">Bid: {bitexchDeal?.bid} </Text>
					</div>
				</button>

			</div>
		</Overlay>
	);

}
