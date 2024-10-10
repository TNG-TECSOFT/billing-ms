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
export function getAddOrdersToSendQuery(){
  return `
  INSERT INTO "order_to_billing" (
    "toMonth", 
    "toYear", 
    "shipperId", 
    "createdAt", 
    "createdBy", 
    "orderId", 
    "productId", 
    "serviceId", 
    "trackingId", 
    "productSku", 
    "productInsuranceSku", 
    "quantity", 
    "insuranceSku", 
    "insurancePercentage", 
    "insuranceValue", 
    "unitPrice", 
    "lineTotal", 
    "shippingPercentage", 
    "shippingValue", 
    "sendAt", 
    "sendBy", 
    "invoiceType", 
    "invoiceNo", 
    "notifyInvoiceAt", 
    "notifyInvoiceBy"
  )
  SELECT
    EXTRACT(MONTH FROM o."createdAt")::INT AS toMonth,
    EXTRACT(YEAR FROM o."createdAt")::INT AS toYear,
    $1 AS shipperId,
    o."createdAt" AS "createdAt",
    'usuario' AS "createdBy",
    o."id" AS "orderId",
    o."product" AS "productId",
    o."service" AS "serviceId",
    1 AS "trackingId",
    'tangoArticle' AS "productSku",
    'insuranceTangoArticle' AS "productInsuranceSku",
    o."piecesQuantity" AS "quantity",
    NULL AS "insuranceSku",
    NULL AS "insurancePercentage",
    0 AS "insuranceValue", 
    10 AS "unitPrice", 
    1000 AS "lineTotal", 
    NULL AS "shippingPercentage",
    50 AS "shippingValue", 
    NULL AS "sendAt",
    NULL AS "sendBy",
    NULL AS "invoiceType",
    NULL AS "invoiceNo",
    NULL AS "notifyInvoiceAt",
    NULL AS "notifyInvoiceBy"
  FROM "order" o
  WHERE o."id" = ANY($2);   
  `
}

export function getOrdersToSendQuery(){
  return `
    SELECT 
    s.name AS shipper,
    otb."createdAt" AS fechaRegistro,
    o.id AS ordenId,
    p.name AS producto,
    sv.name AS servicio,
    otb."productSku" AS productoTango,
    n."name" AS nodoImposicion,
    otb."quantity" AS cantidad,
    otb."unitPrice" AS importeUnitario,
    otb."insurancePercentage" AS porcentajeSeguro,
    otb."insuranceValue" AS importeSeguro,
    otb."lineTotal" AS total
  FROM 
    order_to_billing as otb
  LEFT JOIN 
    shipper as s ON otb."shipperId" = s."idShipper"
  LEFT JOIN 
    "order" as o ON otb."orderId" = o.id
  LEFT JOIN 
    product p ON otb."productId" = p.id
  LEFT JOIN 
    services as sv ON otb."serviceId" = sv.id
  LEFT JOIN 
  node as n on o.id = n.id
  `
}