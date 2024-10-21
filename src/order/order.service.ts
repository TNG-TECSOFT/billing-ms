import { Injectable } from '@nestjs/common';
import { AddOrderToBillingRequestDto } from './dto/add-order-to-billing.dto';
import { OrderToBillingRepository } from './repositories/order-to-billing.repository';
import { GetOrderToBillingDto } from './dto/get-order-to-billing.dto';
import { BillingService } from '../billing/billing.service';
import { BillableOrdersDto } from '../billing/dto/billable-orders.dto';


@Injectable()
export class OrderService {
  constructor(
    private readonly orderToBillingRepository: OrderToBillingRepository,
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
    const { params } = query
    return await this.orderToBillingRepository.getOrdersToBilling(params);
  }

  async deleteOrder(id: number): Promise<boolean> {
    return await this.orderToBillingRepository.deleteOrderById(id);
  }
}
