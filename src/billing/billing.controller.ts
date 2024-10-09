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
    return await this.billingService.getBillableOrders(params);
  }
}