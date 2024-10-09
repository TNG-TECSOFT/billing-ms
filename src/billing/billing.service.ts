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
        validatedParams.momentId,
        validatedParams.createdAtFrom,
        validatedParams.createdAtTo
      ];

      console.log(paramsArray);

      const query = getBillableOrdersQuery() + 
        `ORDER BY ${validatedParams.sort} ${validatedParams.order} LIMIT ${validatedParams.limit} OFFSET ${validatedParams.offset};`;
      const result = await queryRunner.query(query, paramsArray);

      console.log(result);
      
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
      !parsedPayload.createdAtFrom ||
      !parsedPayload.createdAtTo
    ) {
      throw new Error('Invalid payload');
    }

    const params: Params = {
      shipperId: parsedPayload.shipperId,
      serviceId: parsedPayload.serviceId || 0,
      productId: parsedPayload.productId || 0,
      impositionPlaceId: parsedPayload.impositionPlaceId || 0, // not used rigth now, need to be added later
      trackingId: parsedPayload.trackingId || 0,
      chanelledNodeId: parsedPayload.chanelledNodeId || 0,  // not used rigth now, need to be added later
      momentId: parsedPayload.momentId || 0,
      createdAtFrom: parsedPayload.createdAtFrom || Date.now(),
      createdAtTo: parsedPayload.createdAtTo || Date.now(),
      sort: parsedPayload.sort || 'id',
      order: parsedPayload.order || 'DESC',
      limit: parsedPayload.limit || 10,
      offset: parsedPayload.offset || parsedPayload.limit * (parsedPayload.page - 1),
      page: parsedPayload.page || 1 // no need to use
    };
    return params
  }
}
