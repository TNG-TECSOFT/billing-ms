import { Injectable } from '@nestjs/common';
import { Params } from './dto/billable-orders-request.dto';
import { BillingRepository } from './billing.repository';

@Injectable()
export class BillingService {
  constructor(private readonly repository: BillingRepository) {}

  async getBillableOrders(params: string): Promise<any> {    
    try {
      const validatedParams: Params = this.validateParamsFromPayload(params);

      const results = await this.repository.getBillableOrders(validatedParams);

      const transformedData = this.processResult(results.data);

      const count = validatedParams.limit;
      const total = results.count;
      const page = validatedParams.page;
      const pageCount = Math.ceil(count / validatedParams.limit);
      const totalAmount = 0; // needs to be added later

      const ordersMap: Map<string, any> = new Map();
      ordersMap.set('orders', transformedData);
      ordersMap.set('count', count);
      ordersMap.set('page', Number(page));
      ordersMap.set('pageCount', pageCount);
      ordersMap.set('total', total);
      ordersMap.set('totalAmount', totalAmount);

      return ordersMap;
    } catch (error) {
      throw new Error(`Error executing custom query: ${error.message}`);
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
      impositionPlaceId: parsedPayload.impositionPlaceId || 0,
      trackingId: parsedPayload.trackingId == '0' ? parsedPayload.trackingId : parsedPayload.trackingId + '%',
      chanelledNode: parsedPayload.chanelledNode || '0',
      momentId: parsedPayload.momentId || 0,
      createdAtFrom: parsedPayload.createdAtFrom || Date.now(),
      createdAtTo: parsedPayload.createdAtTo || Date.now(),
      sort: parsedPayload.sort == 'id' ? '' : `, "${parsedPayload.sort}"`,
      order: parsedPayload.order || 'DESC',
      limit: parsedPayload.limit || 10,
      offset: parsedPayload.offset || parsedPayload.limit * (parsedPayload.page - 1),
      page: parsedPayload.page || 1,
      selectAll: parsedPayload.selectAll || false
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
                billingAmount: 500, // Placeholder, needs to be calculated
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
            price: 500, // Placeholder, needs to be calculated
        };

        // Add the piece to the existing order's pieces array
        existingOrder.pieces.push(piece);

        return acc;
    }, []);

    return transformedData;
  }
}
