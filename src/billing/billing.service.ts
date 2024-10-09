import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { Params } from './dto/billable-orders-request.dto';
import { getBillableOrdersQuery } from '../common/constants/queries';

@Injectable()
export class BillingService {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async getBillableOrders(params: string): Promise<any> {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const validatedParams: Params = this.validateParamsFromPayload(params);
      // const paramsArray = Object.values(validatedParams);
      // paramsArray.pop();

      const paramsArray = [
        validatedParams.shipperId,
        validatedParams.serviceId,
        validatedParams.productId,
        validatedParams.trackingId,
        validatedParams.moment,
        validatedParams.createdAtFrom,
        validatedParams.createdAtTo,
        validatedParams.limit,
        validatedParams.offset
      ];

      console.log(paramsArray);

      const query = getBillableOrdersQuery();
      const result = await queryRunner.query(query, paramsArray);
      
      await queryRunner.commitTransaction();
      
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error executing custom query: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private validateParamsFromPayload(payload: string): Params {
    const parsedPayload = JSON.parse(payload);

    if (!parsedPayload ||
      !parsedPayload.shipperId ||
      !parsedPayload.serviceId ||
      !parsedPayload.productId ||
      !parsedPayload.createdAtFrom ||
      !parsedPayload.createdAtTo ||
      !parsedPayload.limit ||
      !parsedPayload.page) {
      throw new Error('Invalid payload');
    }

    const params: Params = {
      shipperId: parsedPayload.shipperId,
      serviceId: parsedPayload.serviceId,
      productId: parsedPayload.productId,
      impositionPlaceId: parsedPayload.impositionPlaceId || 0,
      trackingId: parsedPayload.trackingId || 0,
      chanelledNode: parsedPayload['chanelledNode.name'] || "",
      moment: parsedPayload['moment.displayName'] || "",
      createdAtFrom: parsedPayload.createdAtFrom,
      createdAtTo: parsedPayload.createdAtTo,
      sort: parsedPayload.sort || 'id',
      order: parsedPayload.order || 'DESC',
      limit: parsedPayload.limit,
      offset: parsedPayload.offset || parsedPayload.limit * (parsedPayload.page - 1),
      page: parsedPayload.page
    };
    return params
  }
}
