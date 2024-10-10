import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { Params } from './dto/billable-orders-request.dto';
import { getBillableOrdersQuery } from '../common/constants/queries';

@Injectable()
export class BillingService {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}

  async getBillableOrders(params: string): Promise<any> {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const validatedParams: Params = this.validateParamsFromPayload(params);

      const paramsArray = [
        validatedParams.shipperId,
        validatedParams.serviceId,
        validatedParams.productId,
        validatedParams.trackingId,
        validatedParams.momentId,
        validatedParams.createdAtFrom,
        validatedParams.createdAtTo
      ];

      const query = getBillableOrdersQuery() + 
        `${validatedParams.sort} ${validatedParams.order} LIMIT ${validatedParams.limit} OFFSET ${validatedParams.offset};`;
      const queryCount = `SELECT COUNT(*) 
      FROM (` + getBillableOrdersQuery() +
        `${validatedParams.sort} ${validatedParams.order} ) AS subquery;`;
      const result = await queryRunner.query(query, paramsArray);
      const resultCount = await queryRunner.query(queryCount, paramsArray);

      const transformedData = this.processResult(result);

      const count = resultCount[0].count;
      const total = 0; // need to be added later
      const page = validatedParams.page;
      const pageCount = Math.ceil(count / validatedParams.limit);
      const totalAmount = 0; // need to be added later

      const ordersMap: Map<string, any> = new Map();
      ordersMap.set('orders', transformedData);
      ordersMap.set('count', count);
      ordersMap.set('page', Number(page));
      ordersMap.set('pageCount', pageCount);
      ordersMap.set('total', total);
      ordersMap.set('totalAmount', totalAmount);
      
      await queryRunner.commitTransaction();

      return ordersMap;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error executing custom query: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  private validateParamsFromPayload(payload: string): Params {
    const parsedPayload = JSON.parse(payload);

    if (!parsedPayload ||
      !parsedPayload.shipperId ||
      !parsedPayload.createdAtFrom ||
      !parsedPayload.createdAtTo
    ) {
      throw new Error('Invalid payload');
    }

    const params: Params = {
      shipperId: parsedPayload.shipperId,
      serviceId: parsedPayload.serviceId || 0,
      productId: parsedPayload.productId || 0,
      impositionPlaceId: parsedPayload.impositionPlaceId || 0, // not used rigth now, need to be added later
      trackingId: parsedPayload.trackingId || 0,
      chanelledNodeId: parsedPayload.chanelledNodeId || 0,  // not used rigth now, need to be added later
      momentId: parsedPayload.momentId || 0,
      createdAtFrom: parsedPayload.createdAtFrom || Date.now(),
      createdAtTo: parsedPayload.createdAtTo || Date.now(),
      // sort: parsedPayload.sort || '"stagesHistory"."createdAt"',
      sort: '"stagesHistory"."createdAt"',
      order: parsedPayload.order || 'DESC',
      limit: parsedPayload.limit || 10,
      offset: parsedPayload.offset || parsedPayload.limit * (parsedPayload.page - 1),
      page: parsedPayload.page || 1 // no need to use
    };
    return params
  }

  private processResult(results: Object[]): any {
    const transformedData = results.reduce((acc: any[], order: any) => {
        // Check if the order already exists in the transformed data
        let existingOrder = acc.find((o: any) => o.id === order.order_id);

        // If the order doesn't exist, create it
        if (!existingOrder) {
            existingOrder = {
                id: order.order_id,
                trackingId: order.order_trackingId,
                address: order.order_address.trim(),
                zipCode: order.order_zipCode,
                province: order.order_province,
                state: order.order_state,
                shipper: {
                    id: order.shipper_id,
                    name: order.shipper_name,
                },
                service: {
                    id: order.service_id,
                },
                chanelledNode: {
                    id: order.chanelledNode_id,
                    name: order.chanelledNode_name,
                },
                pieces: [],
                product: {
                    id: order.product_id,
                    productShippers: [
                        {
                            dimensionalFactor: order.productShipper_dimensionalFactor,
                        },
                    ],
                },
                billingAmount: 500, // Placeholder, can be dynamically set if needed
            };
            acc.push(existingOrder);
        }

        // Create the piece object and add it to the order's pieces array
        const piece = {
            id: order.piece_id,
            SKU: order.piece_SKU,
            height: order.piece_height,
            width: order.piece_width,
            length: order.piece_length,
            weight: order.piece_weight,
            stagesHistory: [
                {
                    id: order.stagesHistory_id,
                    createdAt: new Date(order.stagesHistory_createdAt),
                    moment: order.moment_id ? {
                        id: order.moment_id,
                        displayName: order.moment_display_name,
                    } : null,
                },
            ],
            price: 500, // Placeholder, can be dynamically set if needed
        };

        // Add the piece to the existing order's pieces array
        existingOrder.pieces.push(piece);

        return acc;
    }, []);

    return transformedData;
  }
}
