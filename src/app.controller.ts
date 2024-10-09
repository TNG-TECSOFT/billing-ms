import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {

  @MessagePattern('checkHealth')
  handleCheckHealth() {
    try{
      return 'OK';
    } catch (error) {
      return error;
    }    
  }
}