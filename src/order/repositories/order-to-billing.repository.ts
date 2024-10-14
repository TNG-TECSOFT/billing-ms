import {
    Brackets,
    EntityManager,
    EntityRepository,
    getManager,
    In,
    Repository,
    SelectQueryBuilder,
  } from 'typeorm';
import { OrderToBilling } from '../entities/order-to-billing.entity';
import { GetOrderToBillingDto } from '../dto/get-order-to-billing.dto';

@EntityRepository(OrderToBilling)
export class OrderToBillingRepository extends Repository<OrderToBilling> {

    async getOrdersToBilling(
        query: GetOrderToBillingDto
    ): Promise<Record<string, any>> {

        const ordersMap: Map<string, any> = new Map();
        
        let count: number = 0;
        let totalAmount: number = 0;

        let builder = getManager().createQueryBuilder(OrderToBilling, 'order');
        // builder.where(idShipper);
        // builder.where(sendAt = null);

        query.params.page = query.params.page ?? 1;
        query.params.limit = query.params.limit ?? 10;
        query.params.order = query.params.order ?? 'ASC';
        query.params.sort = query.params.sort ?? 'createdAt';

        const queryOrder = query.params.order == 'ASC' ? "ASC" : "DESC";
        //if (!!query.params.sort && query.params.order) {
          builder.orderBy(`${query.params.sort}`, queryOrder);
        //}
        
        //if (query.params.page > 0 && query.params.limit) {
          builder = builder.take(query.params.limit).skip(query.params.limit * (query.params.page - 1));
        //}

        const [ordersData, total] = await Promise.all([
            builder.getMany(),
            builder.getCount(),
          ]);
        let orders = JSON.parse(JSON.stringify(ordersData));
        count = orders.length;
        let pageCount = count / Number(query.params.limit);

        if (pageCount <= 1) {
          pageCount = Math.round(pageCount);
        } else {
          pageCount = Math.round(pageCount + 1);
        }
  
        if (pageCount <= 0) {
          pageCount++;
        }

        ordersMap.set('orders', ordersData);
        ordersMap.set('count', count);
        ordersMap.set('page', Number(query.params.page));
        ordersMap.set('pageCount', pageCount);
        ordersMap.set('total', total);
        ordersMap.set('totalAmount', totalAmount);

        return ordersMap;
    }

}