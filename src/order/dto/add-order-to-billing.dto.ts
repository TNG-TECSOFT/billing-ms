import { IsNotEmpty, IsNumber, IsArray, IsString, ValidateNested} from 'class-validator';
import { Type } from 'class-transformer';

class AddOrderToBillingDto {
    @IsNotEmpty()
    @IsNumber()
    shipperId: number;

    @IsNotEmpty()
    @IsArray()
    ordersIds: number[];
    
}

class AddOrderToBillingRequestDto {
    @IsNotEmpty()
    @IsString()
    token: string;

    @ValidateNested()
    @Type(() => AddOrderToBillingDto)
    orderInfo: AddOrderToBillingDto;
}

export {AddOrderToBillingDto, AddOrderToBillingRequestDto}