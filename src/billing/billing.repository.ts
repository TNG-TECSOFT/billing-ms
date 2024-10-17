import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection, QueryRunner } from 'typeorm';
import { getBillableOrdersQuery } from '../common/constants/queries';

export class BillingRepository{
  constructor(
    @InjectConnection() private readonly connection: Connection
  ) {}
  async getBillableOrders(params: any): Promise<any> {
    const queryRunner: QueryRunner = this.connection.createQueryRunner();
    
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const paramsArray = [
        params.shipperId,
        params.momentId,
        params.createdAtFrom,
        params.createdAtTo,       
        ];

      let query = getBillableOrdersQuery();
      params.serviceId == 0 ? query = query.replace(':servicePlaceholder','') : query = query.replace(':servicePlaceholder',`AND "order"."service" = ${params.serviceId}`);
      params.productId == 0 ? query = query.replace(':productPlaceholder','') : query = query.replace(':productPlaceholder',`AND "order"."product" = ${params.productId}`);
      params.trackingId == '0' ? query = query.replace(':trackingIdPlaceholder','') : query = query.replace(':trackingIdPlaceholder',`AND "order"."trackingId" LIKE '${params.trackingId}'`);
      params.chanelledNode == '0' ? query = query.replace(':chanelledNodePlaceholder','') : query = query.replace(':chanelledNodePlaceholder',`AND "chanelledNode"."name" LIKE '${params.chanelledNode}'`);
      params.impositionPlaceId == 0 ? 
        query = query.replace(':impositionPlacePlaceholder','AND "BR"."payforimpositionplace" = false') : 
        query = query.replace(':impositionPlacePlaceholder',`AND "BR"."payforimpositionplace" = true AND "BR"."impositionplaceid" = ${params.impositionPlaceId}`);
      
      const queryCount = `SELECT COUNT(*) FROM (${query}) AS subquery;`;

      params.selectAll ? query += ';' : query += ` LIMIT ${params.limit} OFFSET ${params.offset};`;

      const result = await queryRunner.query(query, paramsArray);
      const resultCount = await queryRunner.query(queryCount, paramsArray);
      
      await queryRunner.commitTransaction();

      return {
        data: result,
        count: resultCount[0].count,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(`Error executing custom query: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }
}