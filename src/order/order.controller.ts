import { Controller, UseGuards, UsePipes, ValidationPipe, NotFoundException, BadRequestException } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { AuthGuard } from '../common/guards/auth.guard';
import { OrderService } from './order.service';
import { AddOrderToBillingRequestDto } from './dto/add-order-to-billing.dto';
import { GetOrderToBillingDto } from './dto/get-order-to-billing.dto';
import { DeleteOrderToBillingDto, DeleteOrderToBillingParamsDto } from './dto/delete-order-to-billing.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('addOrderToBilling')
  async handleAddOrderToBilling(@Payload() body: AddOrderToBillingRequestDto): Promise<any> {
    return await this.orderService.addOrderToBilling(body);
  }

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('getAllOrderToBilling')
  async handleGetAllOrderToBilling(@Payload() query: GetOrderToBillingDto): Promise<any> {
    return await this.orderService.getOrderToBilling(query);
  }

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('deleteOrderToBilling')
  async deleteOrder(@Payload() data: DeleteOrderToBillingDto): Promise<any> {

    const { params } = data;
    const { id } = params;

    const deleted = await this.orderService.deleteOrder(id);
    if (!deleted) {
      throw new NotFoundException('Orden no encontrada');
    }
    return { message: 'Orden eliminada correctamente', id };
  }
}