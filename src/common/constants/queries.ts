export function getBillableOrdersQuery() {
  return `
  SELECT  DISTINCT ON ("order"."id", "piece"."id")
    "order"."id" AS "order_id", 
    "order"."trackingId" AS "order_trackingId", 
    "order"."address" AS "order_address", 
    "order"."zipCode" AS "order_zipCode", 
    "order"."province" AS "order_province", 
    "order"."state" AS "order_state", 
    "shipper"."id" AS "shipper_id", 
    "shipper"."name" AS "shipper_name", 
    "service"."id" AS "service_id", 
    "chanelledNode"."id" AS "chanelledNode_id", 
    "chanelledNode"."name" AS "chanelledNode_name", 
    "piece"."id" AS "piece_id", 
    "piece"."SKU" AS "piece_SKU", 
    "piece"."height" AS "piece_height", 
    "piece"."width" AS "piece_width", 
    "piece"."length" AS "piece_length", 
    "piece"."weight" AS "piece_weight", 
    "stagesHistory"."id" AS "stagesHistory_id", 
    "stagesHistory"."createdAt" AS "stagesHistory_createdAt", 
    "moment"."id" AS "moment_id", 
    "moment"."display_name" AS "moment_display_name", 
    "product"."id" AS "product_id", 
    "productShipper"."dimensionalFactor" AS "productShipper_dimensionalFactor", 
    "order"."product" 
  FROM 
    "order" "order" 
    LEFT JOIN "shipper" "shipper" ON "shipper"."id" = "order"."shipper" 
    LEFT JOIN "stage" "stage" ON "stage"."id" = "order"."stageId" 
    LEFT JOIN "services" "service" ON "service"."id" = "order"."service" 
    LEFT JOIN "node" "chanelledNode" ON "chanelledNode"."id" = "order"."chanelledNodeId" 
    LEFT JOIN "piece" "piece" ON "piece"."orderId" = "order"."id" 
    LEFT JOIN "stages_history" "stagesHistory" ON "stagesHistory"."pieceId" = "piece"."id" 
    LEFT JOIN "stage" "recordedStage" ON "recordedStage"."id" = "stagesHistory"."stageId" 
    LEFT JOIN "moments" "moment" ON "moment"."id" = "stagesHistory"."momentId" 
    LEFT JOIN "product" "product" ON "product"."id" = "order"."product" 
    LEFT JOIN "product_shipper_products_product" "productShipper_product" ON "productShipper_product"."productId" = "product"."id" 
    LEFT JOIN "product_shipper" "productShipper" ON "productShipper"."id" = "productShipper_product"."productShipperId" 
  WHERE 
    "shipper"."id" = $1
    AND ("service"."id" = $2 OR $2 = '0')
    AND "shipper"."id" = "productShipper"."shipperId" 
    AND ("product"."id" = $3 OR $3 = '0')
    AND "shipper"."isActive" = true
    AND ("order"."trackingId" = $4 OR $4 = '0')
    AND ("moment"."id" = $5 OR $5 = 0)
    AND "order"."createdAt" BETWEEN $6 AND $7
  ORDER BY 
    "order"."id", "piece"."id", 
  `;
  /* SELECT DISTINCT ON ("piece"."id")
      "order"."id" AS "orderId",
      "order"."trackingId",
      "order"."address",
      "order"."zipCode",
      "order"."province",
      "order"."state",
      "order"."product",
      "shipper"."id" AS "shipperId",
      "shipper"."name" AS "shipperName",
      "product"."id" AS "productId",
      "productShipper"."dimensionalFactor",
      "services"."id" AS "serviceId",
      "chanelledNode"."id" AS "chanelledNodeId",
      "chanelledNode"."name" AS "chanelledNodeName",
      "piece"."id" AS "pieceId",
      "piece"."height",
      "piece"."width",
      "piece"."SKU",
      "piece"."length",
      "piece"."weight",
      "stagesHistory"."id" AS "stagesHistoryId",
      "stagesHistory"."createdAt" AS "stagesHistoryCreatedAt",
      "moment"."id" AS "momentId",
      "moment"."display_name" AS "momentDisplayName"
    FROM "order"
      LEFT JOIN "piece" ON "order"."id" = "piece"."orderId"
      LEFT JOIN "shipper" ON "order"."shipper" = "shipper"."id"
      LEFT JOIN "stage" ON "order"."stageId" = "stage"."id"
      LEFT JOIN "services" ON "order"."service" = "services"."id"
      LEFT JOIN "node" AS "chanelledNode" ON "order"."chanelledNodeId" = "chanelledNode"."id"
      LEFT JOIN "stages_history" AS "stagesHistory" ON "piece"."id" = "stagesHistory"."pieceId"
      LEFT JOIN "stage" as "recordedStage" ON "stagesHistory"."stageId" = "recordedStage"."id"
      LEFT JOIN "moments" AS "moment" ON "stagesHistory"."momentId" = "moment"."id"
      LEFT JOIN "product" ON "order"."product" = "product"."id"
      LEFT JOIN "product_shipper" AS "productShipper" ON "shipper"."id" = "productShipper"."shipperId"
      LEFT JOIN "product_shipper_products_product" ON "product"."id" = "product_shipper_products_product"."productId"
      AND "product_shipper_products_product"."productShipperId" = "productShipper"."id"
    WHERE 
      "order"."shipper" = $1
      AND ("order"."service" = $2 OR $2 = '0')
      AND ("order"."product" = $3 OR $3 = '0')
      AND ("order"."originalTrackingId" = $4 OR $4 = '0')
      AND ("moment"."id" = $5 OR $5 = 0)
      AND "stagesHistory"."createdAt" BETWEEN $6 AND $7
    ORDER BY 
      "order"."id", "piece"."id", "stagesHistory"."createdAt" DESC
    LIMIT 10 OFFSET 0;
  `; */
}