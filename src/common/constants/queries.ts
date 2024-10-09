export function getBillableOrdersQuery() {
  return `
    SELECT 
      "order"."id",
      "order"."originalTrackingId",
      "order"."address",
      "order"."zipCode",
      "order"."province",
      "order"."state",
      "order"."product",
      "product_shipper"."shipperId",
      "shipper"."name" AS "shipperName",
      "product_shipper_products"."product_id",
      "product_shipper"."dimensionalFactor",
      "services"."id" AS "serviceId",
      -- "chanelledNode"."id" AS "chanelledNodeId",
      -- "chanelledNode"."name" AS "chanelledNodeName",
      "piece"."id" AS "pieceId",
      "piece"."height",
      "piece"."width",
      "piece"."SKU",
      "piece"."length",
      "piece"."weight",
      "stages_history"."id" AS "stagesHistoryId",
      "stages_history"."createdAt" AS "stagesHistoryCreatedAt",
      "moments"."id" AS "momentId",
      "moments"."display_name" AS "momentDisplayName"
    FROM "order"
    LEFT JOIN "shipper" ON "order"."shipper" = "shipper"."id"
    LEFT JOIN "stage" ON "order"."stageId" = "stage"."id"
    LEFT JOIN "services" ON "order"."service" = "services"."id"
    LEFT JOIN "piece" ON "order"."id" = "piece"."orderId"
    LEFT JOIN "stages_history" ON "piece"."id" = "stages_history"."pieceId"
    LEFT JOIN "moments" ON "stages_history"."momentId" = "moments"."id"
    LEFT JOIN "product" ON "order"."product" = "product"."id"
    LEFT JOIN "product_shipper" ON "shipper"."id" = "product_shipper"."shipperId"
    LEFT JOIN "product_shipper_products" ON "product_shipper"."id" = "product_shipper_products"."product_shipper_id"
    AND "product_shipper_products"."product_id" = "product"."id"
    WHERE 
      "order"."shipper" = $1
      AND ("order"."service" = $2 OR $2 = '0')
      AND ("order"."product" = $3 OR $3 = '0')
      AND ("order"."originalTrackingId" = $4 OR $4 = '0')
      AND ("moments"."id" = $5 OR $5 = 0)
      AND "stages_history"."createdAt" BETWEEN $6 AND $7
     `;
    
    //  ORDER BY 
    //   "stagesHistoryCreatedAt" DESC
    // LIMIT $8 OFFSET $9;
 

  // return `
  //   SELECT 
  //     "order"."id",
  //     "order"."originalTrackingId",
  //     "order"."address",
  //     "order"."zipCode",
  //     "order"."province",
  //     "order"."state",
  //     "order"."product",
  //     "product_shipper"."shipperId",
  //     "shipper"."name" AS "shipperName",
  //     "product_shipper_products"."product_id",
  //     "product_shipper"."dimensionalFactor",
  //     "services"."id" AS "serviceId",
  //     -- "chanelledNode"."id" AS "chanelledNodeId",
  //     -- "chanelledNode"."name" AS "chanelledNodeName",
  //     "piece"."id" AS "pieceId",
  //     "piece"."height",
  //     "piece"."width",
  //     "piece"."SKU",
  //     "piece"."length",
  //     "piece"."weight",
  //     "stages_history"."id" AS "stagesHistoryId",
  //     "stages_history"."createdAt" AS "stagesHistoryCreatedAt",
  //     "moments"."id" AS "momentId",
  //     "moments"."display_name" AS "momentDisplayName"
  //   FROM "order"
  //   LEFT JOIN "shipper" ON "order"."shipper" = "shipper"."id"
  //   LEFT JOIN "stage" ON "order"."stageId" = "stage"."id"
  //   LEFT JOIN "services" ON "order"."service" = "services"."id"
  //   -- LEFT JOIN "chanelledNode" ON "order"."chanelledNodeId" = "chanelledNode"."id"
  //   LEFT JOIN "piece" ON "order"."id" = "piece"."orderId"
  //   LEFT JOIN "stages_history" ON "piece"."id" = "stages_history"."pieceId"
  //   -- LEFT JOIN "recordedStage" ON "stages_history"."recordedStageId" = "recordedStage"."id"
  //   LEFT JOIN "moments" ON "stages_history"."momentId" = "moments"."id"
  //   LEFT JOIN "product" ON "order"."product" = "product"."id"
  //   LEFT JOIN "product_shipper" ON "shipper"."id" = "product_shipper"."shipperId"
  //   LEFT JOIN "product_shipper_products" ON "product_shipper"."id" = "product_shipper_products"."product_shipper_id"
  //   AND "product_shipper_products"."product_id" = "product"."id"
  //   WHERE 
  //     "shipper"."id" = $1
  //     AND "services"."id" = $2
  //     AND "product_shipper_products"."product_id" = $3
  //     -- AND "order"."impositionPlaceId" = $4
  //     AND "order"."originalTrackingId" = $5
  //     -- AND "chanelledNode"."name" = $6
  //     AND "moments"."display_name" = $7
  //     AND "stages_history"."createdAt" BETWEEN $8 AND $9
  //   ORDER BY 
  //     "stagesHistoryCreatedAt" DESC
  //   LIMIT $12 OFFSET $13;
  // `;
}