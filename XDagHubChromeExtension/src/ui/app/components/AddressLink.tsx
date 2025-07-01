
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";
import { ButtonConnectedTo } from "../shared/ButtonConnectedTo";
import { Text } from "../shared/text";
import { Copy12, ArrowUpRight12 } from "_assets/icons/tsIcons";
import { formatAddress } from "_src/xdag/typescript/utils";
import { useTranslation } from "react-i18next";

interface AddressLinkProps {
	xdagAddress: string;
}

export function AddressLink({ xdagAddress }: AddressLinkProps) {

	const { t } = useTranslation();

	const copyToAddress = useCopyToClipboard( xdagAddress || "", {
		copySuccessMessage: t( "AccountSelector.AddressCopied" ),
	} );
	
	const openExplorer = () => {
		if (xdagAddress) {
			const explorerUrl = `https://testnet-explorer.xdagj.org/block/${xdagAddress}`;
			window.open(explorerUrl, '_blank');
		}
	};
	

	const buttonText = (
		<Text mono variant="bodySmall" truncate>
			{ (xdagAddress ? formatAddress( xdagAddress ) : "") }
		</Text>
	);

		return (
			<div className="flex items-center gap-1">
				<ButtonConnectedTo
					text={ buttonText }
					onClick={ copyToAddress }
					iconAfter={ <Copy12 data-testid="copy-address"/> }
					bgOnHover="grey"
				/>
				<button
					onClick={ openExplorer }
					className="outline-0 flex items-center justify-center p-1 transition-colors bg-transparent border-0 "
					title="在区块链浏览器中查看"
				>
					<ArrowUpRight12 className="text-gray-60 hover:text-hero-dark" />
				</button>
			</div>
		);
	
}
