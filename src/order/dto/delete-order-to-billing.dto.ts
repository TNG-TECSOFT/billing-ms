import { IsString, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class DeleteOrderToBillingParamsDto {

    @IsNumber()
    id: number;
}

class DeleteOrderToBillingDto {

    @IsString()
    token: string;

    @ValidateNested()
    @Type(() => DeleteOrderToBillingParamsDto)
    params: DeleteOrderToBillingParamsDto;
}

export {DeleteOrderToBillingParamsDto, DeleteOrderToBillingDto}