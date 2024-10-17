import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { getBillableOrdersQuery, getAddOrdersToSendQuery, getOrdersToSendQuery } from '../common/constants/queries';
import { AddOrderToBillingRequestDto } from './dto/add-order-to-billing.dto';
import { OrderToBillingRepository } from './repositories/order-to-billing.repository';
import { GetOrderToBillingDto } from './dto/get-order-to-billing.dto';
import { Params } from '../billing/dto/billable-orders-request.dto';
import { BillingRepository } from '../billing/billing.repository';

@Injectable()
export class OrderService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly orderToBillingRepository: OrderToBillingRepository,
    private readonly billingRepository: BillingRepository
  ) {}

  async addOrderToBilling(ordersDto: AddOrderToBillingRequestDto): Promise<any> {
    const queryRunner : QueryRunner = this.connection.createQueryRunner();

    const { params } = ordersDto;
    const { shipperId, ordersIds } = ordersDto.orderInfo;

    const validatedParams: Params = this.validateParamsFromPayload(params);

    if(!validatedParams.selectAll){
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const paramsArray = [
          shipperId,
          [ordersIds]
        ];
  
        const query = getAddOrdersToSendQuery();
        const result = await queryRunner.query(query, paramsArray);
  
        await queryRunner.commitTransaction();
        
        return {
          statusCode: 200,
          message: `Se agregaron las siguientes ordenes en espera de enviar a facturar: ${ordersIds.join(', ')}`,
          data: ordersIds
        }
        
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new Error(`Error ejecutando query: ${error.message}`);
      } finally {
        await queryRunner.release();
      }
    }
    else {
      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const orders = await this.billingRepository.getBillableOrdersNoLimit(validatedParams);

        const ordersIds = orders.data.map(order => order.order_id);

        const paramsArray = [
          shipperId,
          [ordersIds]
        ];

        const query = getAddOrdersToSendQuery();
        const result = await queryRunner.query(query, paramsArray);
  
        await queryRunner.commitTransaction();
        
        return {
          statusCode: 200,
          message: `Se agregaron las siguientes ordenes en espera de enviar a facturar: ${ordersIds.join(', ')}`,
          data: ordersIds
        }

      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new Error(`Error ejecutando query: ${error.message}`);
      } finally {
        await queryRunner.release();
      }
    }
  }

  async getOrderToBilling(query: GetOrderToBillingDto): Promise<any> {
    return await this.orderToBillingRepository.getOrdersToBilling(query);
  }

  async deleteOrder(id: number): Promise<boolean> {
    return await this.orderToBillingRepository.deleteOrderById(id);
  }

  private validateParamsFromPayload(payload: string): Params {
    const parsedPayload = JSON.parse(payload);

    // Complete the params object with default values when necessary
    const params: Params = {
      shipperId: parsedPayload.shipperId,
      serviceId: parsedPayload.serviceId || 0,
      productId: parsedPayload.productId || 0,
      impositionPlaceId: parsedPayload.impositionPlaceId || 0,
      trackingId: parsedPayload.trackingId == '0' ? parsedPayload.trackingId : parsedPayload.trackingId + '%',
      chanelledNode: parsedPayload.chanelledNode || '0',
      momentId: parsedPayload.momentId || 0,
      createdAtFrom: parsedPayload.createdAtFrom || Date.now(),
      createdAtTo: parsedPayload.createdAtTo || Date.now(),
      sort: parsedPayload.sort == 'id' ? '' : `, "${parsedPayload.sort}"`,
      order: parsedPayload.order || 'DESC',
      limit: parsedPayload.limit || 10,
      offset: parsedPayload.offset || parsedPayload.limit * (parsedPayload.page - 1),
      page: parsedPayload.page || 1,
      selectAll: parsedPayload.selectAll || false
    };
    return params
  }
}
