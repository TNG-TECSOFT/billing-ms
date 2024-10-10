function getBillableOrdersQuery() {
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