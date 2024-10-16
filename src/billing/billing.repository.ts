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
        params.serviceId,
        params.productId,
        params.trackingId,
        params.momentId,
        params.createdAtFrom,
        params.createdAtTo,
        params.chanelledNode,
        params.impositionPlaceId
      ];

      let query = `${getBillableOrdersQuery()} ${params.sort} ${params.order}`;
      query += params.selectAll ? ';' : ` LIMIT ${params.limit} OFFSET ${params.offset};`;

      const queryCount = `SELECT COUNT(*) 
      FROM (` + getBillableOrdersQuery() +
        `${params.sort} ${params.order} ) AS subquery;`;

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