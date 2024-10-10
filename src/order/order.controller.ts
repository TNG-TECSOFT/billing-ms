import { Controller, UseGuards, UsePipes, ValidationPipe, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthGuard } from '../common/guards/auth.guard';
import { OrderService } from './order.service';
import { AddOrderToBillingRequestDto } from './dto/add-order-to-send.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(AuthGuard)  
  @UsePipes(new ValidationPipe({ transform: true}))
  @MessagePattern('addOrderToBilling')
  async handleAddOrderToBilling(@Payload() body: AddOrderToBillingRequestDto): Promise<any> {
    return await this.orderService.addOrderToBilling(body);
  }
}