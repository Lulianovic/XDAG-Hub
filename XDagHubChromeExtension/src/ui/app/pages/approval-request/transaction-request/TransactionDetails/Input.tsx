
import {Text} from "_src/ui/app/shared/text";
import BigNumber from "bignumber.js";


const formatInput = (input: any) => {
    if( typeof input.value === "object" ){
        return (
            <div>
                input: { (input.value as BigNumber).toString()}
            </div>
        )
    }
    return (
        <div>
            input: {input.value.toString()}
        </div>
    )
}


export function Input({input}: any) {

    console.log(" input :\n", input);

    return (
        <div className="break-all">
            <Text variant="pBodySmall" weight="medium" color="steel-dark" mono>
                {formatInput(input)}
            </Text>
        </div>
    );
}
