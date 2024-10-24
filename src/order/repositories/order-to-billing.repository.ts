import {
  EntityRepository,
  getManager,
  Repository,
  getConnection
} from 'typeorm';
import { OrderToBilling } from '../entities/order-to-billing.entity';
import { getAddOrdersToSendQuery } from '../../common/constants/queries';
import { BillableOrdersDto } from '../../billing/dto/billable-orders.dto';
import { getDataFromToken } from '../../common/utils/utils';
import { GetOrderToBillingParamsDto } from '../dto/get-order-to-billing.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@EntityRepository(OrderToBilling)
export class OrderToBillingRepository extends Repository<OrderToBilling> {
  async getOrdersToBilling(
    params: GetOrderToBillingParamsDto
  ): Promise<Record<string, any>> {
    try {    
      const ordersMap: Map<string, any> = new Map();

    let rawQuery = `
      SELECT 
        otb.id AS "id",
        CONCAT(EXTRACT(MONTH FROM NOW()), '/', EXTRACT(YEAR FROM NOW())) AS "periodo",
        s.name AS shipper,
        TO_CHAR(otb."createdAt", 'DD/MM/YYYY') AS "fechaRegistro",
        o."trackingId" AS "trackingId",
        p.name AS "producto",
        sv.name AS "servicio",
        otb."productSku" AS "productoTango",
        n."name" AS "nodoDestino",
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
        WHERE 
        s.id = ${params.shipperId} 
        AND otb."sendAt" is NULL
        :servicePlaceholder
        :productPlaceholder
        :trackingIdPlaceholder
        :impositionPlacePlaceholder
        :productSkuPlaceholder
    `;


    params.service == '0' ? rawQuery = rawQuery.replace(':servicePlaceholder','') : rawQuery = rawQuery.replace(':servicePlaceholder',`AND "sv"."name" ILIKE '%${params.service}%'`);
    params.product == '0' ? rawQuery = rawQuery.replace(':productPlaceholder','') : rawQuery = rawQuery.replace(':productPlaceholder',`AND "p"."name" ILIKE '%${params.product}%'`);
    params.tracking == '0' ? rawQuery = rawQuery.replace(':trackingIdPlaceholder','') : rawQuery = rawQuery.replace(':trackingIdPlaceholder',`AND "o"."trackingId" ILIKE '%${params.tracking}%'`);
    params.impositionPlace == '0' ? 
        rawQuery = rawQuery.replace(':impositionPlacePlaceholder','') : 
        rawQuery = rawQuery.replace(':impositionPlacePlaceholder',`AND "n"."name" ILIKE '%${params.impositionPlace}%'`);
    params.productSku == '0' ? rawQuery = rawQuery.replace(':productSkuPlaceholder','') : rawQuery = rawQuery.replace(':productSkuPlaceholder', `AND "otb"."productSku" ILIKE '%${params.productSku}%'`)

      if (!!params.sort && params.order) {
        const queryOrder = params.order == 'ASC' ? 'ASC' : 'DESC';
        rawQuery += ` ORDER BY "${params.sort}" ${queryOrder}`;
      } else {
        rawQuery += ` ORDER BY otb.id ASC`;
      }

    const [totalCountResult] = await getManager().query(`
      SELECT COUNT(*) FROM (${rawQuery}) AS total 
    `);

    const total = totalCountResult.count; 

      if (params.page >= 1 && params.limit) {
        const skip = params.limit * (params.page - 1);
        rawQuery += ` LIMIT ${params.limit} OFFSET ${skip}`;
      }

      const [ordersData] = await Promise.all([
        getManager().query(rawQuery),
      ]);

      const count = params.limit;

      const pageCount = Math.ceil(Number(total) / Number(params.limit));

      const totalsQuery = `
        SELECT 
          SUM(otb."lineTotal") AS "totalAmountToPay",
          SUM(otb."insuranceValue") AS "totalAmountInsurance"
        FROM order_to_billing otb
        WHERE otb."shipperId" = ${params.shipperId} AND otb."sendAt" IS NULL
    `;

      const totalsResult = await getManager().query(totalsQuery);
      const totalAmountToPay = parseFloat(totalsResult[0].totalAmountToPay) || 0;
      const totalAmountInsurance = parseFloat(totalsResult[0].totalAmountInsurance) || 0;

      ordersMap.set('orders', ordersData);
      ordersMap.set('count', count);
      ordersMap.set('page', Number(params.page));
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
    } catch (error) {
      throw new HttpException(`Error ejecutando query: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addOrdersToBilling(orders: BillableOrdersDto[], token: string): Promise<any> {
    const connection = getConnection();
    const queryRunner = connection.createQueryRunner();
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      orders.forEach(async (order) => {
        const userData = getDataFromToken(token)

        const otbParams = [
          order.id,
          order.billingAmount.toFixed(2),
          order.insuranceValue.toFixed(2),
          order.insurancePercentage,
          userData.username,
        ];

        const query = getAddOrdersToSendQuery();
        await queryRunner.query(query, otbParams);
      });
      await queryRunner.commitTransaction();

      return {
        statusCode: 200,
        message: `Se agregaron ${orders.length} órdenes en espera de enviar a facturar.`
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new HttpException(`Error ejecutando query: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOrderById(id: number): Promise<boolean> {
    try{
      const result = await getConnection()
        .createQueryBuilder()
        .delete()
        .from('order_to_billing')
        .where('id = :id', { id })
        .execute();

      const response = result.affected > 0;
      return response;
    } catch (error) {
      throw new HttpException(`Error eliminando orden: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
