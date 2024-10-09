import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { envs } from '../../config/env';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
  try {
    const client = context.switchToRpc().getData(); // Get the payload from the RPC context
    if (!client.token) {
      throw new UnauthorizedException({
        message: 'Forbidden resource',
        error: {
          title: 'Missing authorization header.',
        },
      });
    }    
      const decoded = jwt.verify(client.token, envs.secret_key);
      client.token = JSON.stringify(decoded);
      return true;
    } catch (err) {
      throw new UnauthorizedException({
        message: 'Forbidden resource',
        error: {
          title: 'Invalid or expired token.',
        },
      });
    }
  }
}
