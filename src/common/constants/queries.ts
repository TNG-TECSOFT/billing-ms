function getBillableOrdersQuery() {
  return `
  SELECT DISTINCT ON ("order"."id", "piece"."id")
    "order"."id" AS "order_id", 
    "order"."trackingId" AS "order_trackingId", 
    "order"."address" AS "order_address", 
    "order"."zipCode" AS "order_zipCode", 
    "order"."province" AS "order_province", 
    "order"."state" AS "order_state", 
    "shipper"."id" AS "shipper_id", 
    "shipper"."name" AS "shipper_name", 
    "services"."id" AS "service_id", 
    "chanelledNode"."id" AS "chanelledNode_id", 
    "chanelledNode"."name" AS "chanelledNode_name", 
    "piece"."id" AS "piece_id", 
    "piece"."SKU" AS "piece_SKU", 
    "piece"."height" AS "piece_height", 
    "piece"."width" AS "piece_width", 
    "piece"."length" AS "piece_length", 
    "piece"."weight" AS "piece_weight", 
    "stages_history"."id" AS "stagesHistory_id", 
    "stages_history"."createdAt" AS "stagesHistory_createdAt", 
    "moments"."id" AS "moment_id", 
    "moments"."display_name" AS "moment_display_name", 
    "product"."id" AS "product_id", 
    "product_shipper"."dimensionalFactor" AS "productShipper_dimensionalFactor"
FROM 
    "order"
    INNER JOIN "shipper" ON "shipper"."id" = "order"."shipper"
    INNER JOIN "piece" ON "piece"."orderId" = "order"."id"
    INNER JOIN "stages_history" ON "stages_history"."pieceId" = "piece"."id"
    INNER JOIN "billing_rule" ON "order"."shipper" = "billing_rule"."shipperid"
        AND "order"."service" = "billing_rule"."serviceid"
        AND "order"."product" = "billing_rule"."productid"
        AND "stages_history"."momentId" = "billing_rule"."momentId"
    INNER JOIN "services" ON "services"."id" = "order"."service"
    INNER JOIN "node" "chanelledNode" ON "chanelledNode"."id" = "order"."chanelledNodeId"
    INNER JOIN "stage" "recordedStage" ON "recordedStage"."id" = "stages_history"."stageId"
    INNER JOIN "moments" ON "moments"."id" = "stages_history"."momentId"
    INNER JOIN "product" ON "product"."id" = "order"."product"
    INNER JOIN "product_shipper_products_product" ON "product_shipper_products_product"."productId" = "product"."id"
    INNER JOIN "product_shipper" ON "product_shipper"."id" = "product_shipper_products_product"."productShipperId"
WHERE 
    "order"."shipper" = $1
    AND ("order"."service" = $2 OR $2 = 0)
    AND ("order"."product" = $3 OR $3 = 0)
    AND "shipper"."id" = "product_shipper"."shipperId"
    AND "shipper"."isActive" = true
	  AND "billing_rule"."active" = true
    AND ("order"."trackingId" LIKE $4 OR $4 = '0')
    AND ("stages_history"."momentId" = $5 OR $5 = 0)
    AND "order"."createdAt" BETWEEN $6 AND $7
    AND ("chanelledNode"."name" LIKE $8 OR $8 = '0')
    AND (
      ("billing_rule"."payforimpositionplace" = false AND $9 = 0) 
      OR 
      ("billing_rule"."payforimpositionplace" = true AND "billing_rule"."impositionplaceid" = $9)
    ) 
ORDER BY 
    "order"."id", "piece"."id"
  `;
}

function getAddOrdersToSendQuery(){
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
    NULL AS "trackingId",
    'tangoArticle' AS "productSku",
    'insuranceTangoArticle' AS "productInsuranceSku",
    o."piecesQuantity" AS "quantity",
    NULL AS "insuranceSku",
    NULL AS "insurancePercentage",
    0 AS "insuranceValue", 
    0 AS "unitPrice", 
    0 AS "lineTotal", 
    NULL AS "shippingPercentage",
    0 AS "shippingValue", 
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

function getOrdersToSendQuery(){
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

export { getBillableOrdersQuery, getAddOrdersToSendQuery, getOrdersToSendQuery };