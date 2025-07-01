import { useEffect, useState } from "react";
import { ConfirmationModal } from "../../../shared/ConfirmationModal";
import { UserApproveContainer } from "_components/user-approve-container";
import {
	useActiveAddress,
	useAppDispatch,
	useGetAllCoins,
} from "_hooks";
import { type TransactionApprovalRequest } from "_payloads/transactions/ApprovalRequest";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { respondToInscriptionRequest } from "_src/ui/app/redux/slices/inscription-requests";
import { InscriptionApprovalRequest } from "_src/shared/messaging/messages/payloads/inscription/InscriptionApprovalRequest";
import { PageMainLayoutTitle } from "_src/ui/app/shared/page-main-layout/PageMainLayoutTitle";
import { InscriptionDetails } from "./InscriptionDetails";
import { CoinAPI, XDAG_TYPE_ARG } from "_src/xdag/typescript/framework";
import { InscChunKs, largeTextToChunks } from "_src/shared/utils/chunkString";
import { setCurChunkResult, setCurInscIsProcessing, setCurInscRequest, setCurInscResponse } from "_src/ui/app/redux/slices/curInscriptionRequestSlice";
import BigNumber from "bignumber.js";
import { Text } from "_src/ui/app/shared/text";
import { X12 } from "_src/ui/assets/icons/tsIcons";

export type TransactionRequestProps = {
	txRequest: TransactionApprovalRequest;
};

export const InscriptionRequest = ({ inscRequest }: { inscRequest: InscriptionApprovalRequest }) => {

	return <></>
/*
	const toAddress = inscRequest.inscription.toAddress;
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const signer = useSigner();
	const [isConfirmationVisible, setConfirmationVisible] = useState(false);
	const activeAddress = useActiveAddress();
	const { data: XDagCoins, isLoading: XDagCoinsIsLoading } = useGetAllCoins(XDAG_TYPE_ARG, activeAddress!,);
	const xDagBalance = CoinAPI.totalBalance(XDagCoins || []);
	const [chunkResult, setChunkResult] = useState<InscChunKs | undefined>(undefined)
	const [isEnoughBalance, setIsEnoughBalance] = useState(false);
	const { t } = useTranslation();

	useEffect(() => {
		const inscString = inscRequest?.inscription?.inscriptionString;
		if (inscString) {
			const inscChunks: InscChunKs | undefined = largeTextToChunks(inscRequest.imageIndex ?? "AA", inscString, inscRequest?.inscription?.awardRatio);
			setChunkResult(inscChunks);
			dispatch(setCurInscRequest(inscRequest));
			dispatch(setCurChunkResult(inscChunks));
		}
	}, [inscRequest, dispatch])

	useEffect(() => {
		const totalCost = chunkResult?.totalCost ?? 0;
		const isEnough = xDagBalance.isGreaterThanOrEqualTo(new BigNumber(totalCost));
		setIsEnoughBalance(isEnough);
	}, [chunkResult, xDagBalance]);

	const isLoading = false;

	if (!signer) {
		throw new Error(" signer is undefined. ");
	}

	return (
		<>
			<UserApproveContainer
				origin={inscRequest.origin}
				originFavIcon={inscRequest.originFavIcon}
				approveTitle={t("InscriptionRequest.Approve")}
				rejectTitle={t("InscriptionRequest.Reject")}
				onSubmit={async (approved: boolean) => {
					if (isLoading) {
						return;
					}
					if (approved) {
						setConfirmationVisible(true);
						return;
					} else {
						window.close();
					}
					// await dispatch(respondToInscriptionRequest({ approved, inscRequestID: inscRequest.id, signer }),);
				}}
				address={toAddress}
				approveLoading={isLoading || isConfirmationVisible}
				approveDisabled={!isEnoughBalance}
			>
				<PageMainLayoutTitle title={t("InscriptionRequest.PageTitle")} />
				<InscriptionDetails inscRequest={inscRequest} inscChunks={chunkResult} />
				{
					!isEnoughBalance && (
						<div className="flex flex-row" >
							<div>
								<X12 className=" mt-1.5 mr-1.5 text-issue-dark" ></X12>
							</div>
							<div>
								<Text weight="bold" color="issue-dark" variant="pBody">
									{t("InscriptionDetails.insufficientBalance")}
								</Text>
							</div>
						</div>
					)
				}
			</UserApproveContainer>
			<ConfirmationModal
				isOpen={isConfirmationVisible}
				title={t("InscriptionRequest.MightFailWarning")}
				hint={t("InscriptionRequest.ChargedGasFeeWarning")}
				confirmStyle="primary"
				confirmText={t("InscriptionRequest.Approve")}
				cancelText={t("InscriptionRequest.Reject")}
				cancelStyle="warning"
				onResponse={
					async (isConfirmed) => {
						if (!isConfirmed) {
							window.close();
						}
						await dispatch(setCurInscIsProcessing(true));
						dispatch(respondToInscriptionRequest({ approved: true, inscRequestID: inscRequest.id, signer }));
						const receiptUrl = `/receipt-inscription?requestId=${encodeURIComponent(inscRequest.id)}&toAddress=${encodeURIComponent(toAddress)}&from=transactions`;
						setConfirmationVisible(false);
						return navigate(receiptUrl);
					}
				}
			/>
		</>
	);
	*/
}
