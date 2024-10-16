import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { getBillableOrdersQuery, getAddOrdersToSendQuery, getOrdersToSendQuery } from '../common/constants/queries';
import { AddOrderToBillingRequestDto } from './dto/add-order-to-billing.dto';
import { OrderToBillingRepository } from './repositories/order-to-billing.repository';
import { GetOrderToBillingDto } from './dto/get-order-to-billing.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly orderToBillingRepository: OrderToBillingRepository
  ) {}

  async addOrderToBilling(ordersDto: AddOrderToBillingRequestDto): Promise<any> {
    const queryRunner : QueryRunner = this.connection.createQueryRunner();
    const { shipperId, ordersIds } = ordersDto.orderInfo;

    const paramsArray = [
      shipperId,
      [ordersIds]
    ];

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

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

  async getOrderToBilling(query: GetOrderToBillingDto): Promise<any> {
    return await this.orderToBillingRepository.getOrdersToBilling(query);
  }

  async deleteOrder(id: number): Promise<boolean> {
    return await this.orderToBillingRepository.deleteOrderById(id);
  }
}
