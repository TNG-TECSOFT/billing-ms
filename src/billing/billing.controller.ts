import { Controller, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthGuard } from '../common/guards/auth.guard';
import { BillingService } from './billing.service';
import { BillableOrdersRequestDto } from './dto/billable-orders-request.dto';

@Controller()
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('getBillableOrders')
  async handleGetBillableOrders(@Payload() payload: BillableOrdersRequestDto): Promise<any> {
    const { params } = payload;
    const resultMap = await this.billingService.getBillableOrders(params)
    
    return {
      data: resultMap.get('orders'),
      count: resultMap.get('count'),
      total: resultMap.get('total'),
      page: resultMap.get('page'),
      pageCount: resultMap.get('pageCount'),
      totalAmount: resultMap.get('totalAmount'),
    };
  }
}