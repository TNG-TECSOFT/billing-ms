import {
  EntityRepository,
  getManager,
  Repository,
  getConnection
} from 'typeorm';
import { OrderToBilling } from '../entities/order-to-billing.entity';
import { GetOrderToBillingDto } from '../dto/get-order-to-billing.dto';
import { Connection, QueryRunner } from 'typeorm';
import { InjectConnection } from '@nestjs/typeorm';
import { getAddOrdersToSendQuery } from '../../common/constants/queries';
import { BillableOrdersDto } from '../../billing/dto/billable-orders.dto';
import { getDataFromToken } from '../../common/utils/utils';

@EntityRepository(OrderToBilling)
export class OrderToBillingRepository extends Repository<OrderToBilling> {
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {
    super();
  }
  async getOrdersToBilling(
    query: GetOrderToBillingDto
  ): Promise<Record<string, any>> {

    const ordersMap: Map<string, any> = new Map();


    let builder = getManager().createQueryBuilder(OrderToBilling, 'order');

    let rawQuery = `
      SELECT 
        otb.id AS "id",
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

    rawQuery += `WHERE s.id = ${query.params.shipperId} AND otb."sendAt" is NULL`

    if (!!query.params.sort && query.params.order) {
      const queryOrder = query.params.order == 'ASC' ? 'ASC' : 'DESC';
      rawQuery += ` ORDER BY ${query.params.sort} ${queryOrder}`;
    } else {
      rawQuery += ` ORDER BY otb.id ASC`;
    }

    const [totalCountResult] = await getManager().query(`
      SELECT COUNT(*) AS total 
      FROM order_to_billing AS otb
      LEFT JOIN shipper AS s ON otb."shipperId" = s.id
      WHERE s.id = ${query.params.shipperId} AND otb."sendAt" IS NULL
    `);

    const total = totalCountResult.total; 

    if (query.params.page >= 1 && query.params.limit) {
      const skip = query.params.limit * (query.params.page - 1);
      rawQuery += ` LIMIT ${query.params.limit} OFFSET ${skip}`;
    }

    const [ordersData] = await Promise.all([
      getManager().query(rawQuery),
    ]);

    const count = query.params.limit;

    const pageCount = Math.ceil(Number(total) / Number(query.params.limit));

    const totalsQuery = `
      SELECT 
        SUM(otb."lineTotal") AS "totalAmountToPay",
        SUM(otb."insuranceValue") AS "totalAmountInsurance"
      FROM order_to_billing otb
      WHERE otb."shipperId" = ${query.params.shipperId} AND otb."sendAt" IS NULL
  `;

    const totalsResult = await getManager().query(totalsQuery);
    const totalAmountToPay = parseFloat(totalsResult[0].totalAmountToPay) || 0;
    const totalAmountInsurance = parseFloat(totalsResult[0].totalAmountInsurance) || 0;

    ordersMap.set('orders', ordersData);
    ordersMap.set('count', count);
    ordersMap.set('page', Number(query.params.page));
    ordersMap.set('pageCount', pageCount);
    ordersMap.set('total', total);
    ordersMap.set('totalAmountToPay', totalAmountToPay);
    ordersMap.set('totalAmountInsurance', totalAmountInsurance);

    return {
      data: ordersMap.get('orders'),
      count: ordersMap.get('count'),
      total: ordersMap.get('total'),
      page: ordersMap.get('page'),
      pageCount: ordersMap.get('pageCount'),
      totalAmountToPay: ordersMap.get('totalAmountToPay'),
      totalAmountInsurance: ordersMap.get('totalAmountInsurance'),
    };
  }

  async addOrdersToBilling(orders: BillableOrdersDto[], token: string): Promise<any> {
    const queryRunner : QueryRunner = this.connection.createQueryRunner();
      
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();
      
      orders.forEach(async order => {

        const userData = getDataFromToken(token)

        const otbParams = [
          order.id,
          order.billingAmount,
          order.insuranceValue,
          order.insurancePercentage,
          userData.username,
        ];          
        
        const query = getAddOrdersToSendQuery();
        const result = await queryRunner.query(query, otbParams);
        
        await queryRunner.commitTransaction();
              
        return {
          statusCode: 200,
          message: `Se agregaron las ${orders.length} órdenes en espera de enviar a facturar.`
        }
      });     
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error ejecutando query: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOrderById(id: number): Promise<boolean> {
    const result = await getConnection()
      .createQueryBuilder()
      .delete()
      .from('order_to_billing')
      .where('id = :id', { id })
      .execute();

    const response = result.affected > 0;
    return response;
  }
}
