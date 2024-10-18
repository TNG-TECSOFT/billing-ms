import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { getAddOrdersToSendQuery } from '../common/constants/queries';
import { AddOrderToBillingRequestDto } from './dto/add-order-to-billing.dto';
import { OrderToBillingRepository } from './repositories/order-to-billing.repository';
import { GetOrderToBillingDto } from './dto/get-order-to-billing.dto';
import { Params } from '../billing/dto/billable-orders-request.dto';
import { BillingRepository } from '../billing/billing.repository';
import { BillingService } from '../billing/billing.service';
import { BillableOrdersDto } from '../billing/dto/billable-orders.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly orderToBillingRepository: OrderToBillingRepository,
    private readonly billingRepository: BillingRepository,
    private readonly billingService: BillingService
  ) {}

  async addOrderToBilling(request: AddOrderToBillingRequestDto): Promise<any> {
    // Get billable orders
    const orders: BillableOrdersDto[] = await this.billingService.getBillableOrders(request.params, request.authorization_core);

    // Add orders to billing
    const result = await this.orderToBillingRepository.addOrdersToBilling(orders, request.token);

    return result;
  }

  async getOrderToBilling(query: GetOrderToBillingDto): Promise<any> {
    return await this.orderToBillingRepository.getOrdersToBilling(query);
  }

  async deleteOrder(id: number): Promise<boolean> {
    return await this.orderToBillingRepository.deleteOrderById(id);
  }
}
