import { IsNotEmpty, IsNumber, IsArray, IsString, ValidateNested, IsOptional} from 'class-validator';
import { Type } from 'class-transformer';

class AddOrderToBillingDto {
    @IsNotEmpty()
    @IsNumber()
    shipperId: number;

    @IsOptional()
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

    @IsOptional()
    @IsString()
    params: string;

    @IsOptional()
    @IsString()
    authorization_core: string;
}

export {AddOrderToBillingDto, AddOrderToBillingRequestDto}