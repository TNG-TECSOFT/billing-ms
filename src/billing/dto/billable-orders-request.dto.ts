import { IsNotEmpty, IsNumber, IsString, IsDate, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Params {
  @IsNotEmpty()
  @IsNumber()
  shipperId: number;

  @IsNotEmpty()
  @IsNumber()
  serviceId: number;

  @IsNotEmpty()
  @IsNumber()
  productId: number;

  @IsNotEmpty()
  @IsNumber()
  impositionPlaceId: number;

  @IsNotEmpty()
  @IsString()
  trackingId: string;

  @IsNotEmpty()
  @IsString()
  chanelledNodeId: string;

  @IsNotEmpty()
  @IsString()
  momentId: string;

  @IsNotEmpty()
  @IsDate()
  createdAtFrom: string;

  @IsNotEmpty()
  @IsDate()
  createdAtTo: string;

  @IsNotEmpty()
  @IsString()
  sort: string;

  @IsNotEmpty()
  @IsString()
  order: string;
  
  @IsNotEmpty()
  @IsNumber()
  limit: number;

  @IsNotEmpty()
  @IsNumber()
  page: number;

  @IsOptional()
  @IsNumber()
  offset: number;
}

class BillableOrdersRequestDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  params: string;
}

export { BillableOrdersRequestDto, Params };
