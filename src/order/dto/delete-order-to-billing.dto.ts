// delete-order-to-billing.dto.ts
import { IsString, IsNotEmpty, ValidateNested, IsObject, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class DeleteOrderToBillingParamsDto {
    @IsNumber()
    @IsNotEmpty()
    id: number;
}

export class DeleteOrderToBillingDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @ValidateNested()
  @Type(() => DeleteOrderToBillingParamsDto)
  params: DeleteOrderToBillingParamsDto;
}


