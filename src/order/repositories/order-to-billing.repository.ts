import {
  EntityRepository,
  getManager,
  Repository,
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

    // Construir la consulta personalizada utilizando la consulta SQL de getOrdersToSendQuery
    let rawQuery = `
      SELECT 
        CONCAT(EXTRACT(MONTH FROM NOW()), '/', EXTRACT(YEAR FROM NOW())) AS "periodo",
        s.name AS shipper,
        otb."createdAt" AS "fechaRegistro",
        o.id AS "ordenId",
        p.name AS "producto",
        sv.name AS "servicio",
        otb."productSku" AS "productoTango",
        n."name" AS "nodoImposicion",
        otb."quantity" AS "cantidad",
        otb."unitPrice" AS "importeUnitario",
        otb."insurancePercentage" AS "porcentajeSeguro",
        otb."insuranceValue" AS "importeSeguro",
        otb."lineTotal" AS "total"
      FROM 
          order_to_billing as otb
      LEFT JOIN 
          shipper as s ON otb."shipperId" = s.id
      LEFT JOIN 
          "order" as o ON otb."orderId" = o.id
      LEFT JOIN 
          product p ON otb."productId" = p.id
      LEFT JOIN 
          services as sv ON otb."serviceId" = sv.id
      LEFT JOIN 
        node as n on o."chanelledNodeId" = n.id
    `;

    if (!!query.params.sort && query.params.order) {
      const queryOrder = query.params.order == 'ASC' ? 'ASC' : 'DESC';
      rawQuery += ` ORDER BY ${query.params.sort} ${queryOrder}`;
    }

    if (query.params.page > 0 && query.params.limit) {
      const skip = query.params.limit * (query.params.page - 1);
      rawQuery += ` LIMIT ${query.params.limit} OFFSET ${skip}`;
    }

    const [ordersData, total] = await Promise.all([
      getManager().query(rawQuery),
      builder.getCount(),
    ]);

    count = ordersData.length;
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

    return {
      data: ordersMap.get('orders'),
      count: ordersMap.get('count'),
      total: ordersMap.get('total'),
      page: ordersMap.get('page'),
      pageCount: ordersMap.get('pageCount'),
      totalAmount: ordersMap.get('totalAmount'),
    };
  }


  async deleteOrderById(id: number): Promise<boolean> {
    const result = await getManager().query(`DELETE FROM order_to_billing WHERE id = $1`, [id]);
    return result.affectedRows > 0;
  }
}
