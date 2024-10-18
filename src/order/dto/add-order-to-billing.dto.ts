import { IsNotEmpty, IsArray, IsString, IsOptional} from 'class-validator';

class AddOrderToBillingRequestDto {
    @IsNotEmpty()
    @IsString()
    token: string;

    @IsOptional()
    @IsString()
    params: string;

    @IsOptional()
    @IsString()
    authorization_core: string;
}

export { AddOrderToBillingRequestDto }