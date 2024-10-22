import { Controller, UseGuards, UsePipes, ValidationPipe, NotFoundException } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthGuard } from '../common/guards/auth.guard';
import { OrderService } from './order.service';
import { GetOrderToBillingDto } from './dto/get-order-to-billing.dto';
import { DeleteOrderToBillingDto } from './dto/delete-order-to-billing.dto';
import { BillableOrdersRequestDto } from '../billing/dto/billable-orders-request.dto';

@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('addOrderToBilling')
  async handleAddOrderToBilling(@Payload() params: BillableOrdersRequestDto): Promise<any> {
    try{
      return await this.orderService.addOrderToBilling(params);
    } catch (error) {
      return error;
    }
  }

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('getAllOrderToBilling')
  async handleGetAllOrderToBilling(@Payload() query: GetOrderToBillingDto): Promise<any> {
    try {
      return await this.orderService.getOrderToBilling(query);
    } catch (error) {
      return error;
    }
  }

  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @MessagePattern('deleteOrderToBilling')
  async deleteOrder(@Payload() data: DeleteOrderToBillingDto): Promise<any> {
    try {
      const { params } = data;
      const { id } = params;

      const deleted = await this.orderService.deleteOrder(id);
      if (!deleted) {
        throw new NotFoundException('Orden no encontrada');
      }
      return { message: 'Orden eliminada correctamente', id };
    } catch (error) {
      return error;
    }
  }
}