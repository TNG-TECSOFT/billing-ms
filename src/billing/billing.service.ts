import { Injectable } from '@nestjs/common';
import { Params } from './dto/billable-orders-request.dto';
import { BillingRepository } from './billing.repository';
import { envs } from '../config/env';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { 
  CriteriaLabel, 
  Variances, 
  calculatePieceBillingAmountByWeight, 
  isValueBetweenRange, 
  calculatePriceByVariance } from '../common/utils/billingRules.utils';
  import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class BillingService {
  constructor(
    private readonly repository: BillingRepository,
    private readonly httpService: HttpService
  ) {}

  async getBillableOrders(params: string, authorization: string): Promise<any> {    
    try {
      const validatedParams: Params = this.validateParamsFromPayload(params);
      // Get the billable orders from the 
      
      if (validatedParams.selectAll){
        throw new HttpException('Funcionalidad temporalmente fuera de servicio', HttpStatus.SERVICE_UNAVAILABLE);
      };
      
      const results = await this.repository.getBillableOrders(validatedParams);

      const billingRulesParams = {
        shipperId: validatedParams.shipperId,
        serviceId: validatedParams.serviceId,
        productId: validatedParams.productId,
        impositionPlaceId: validatedParams.impositionPlaceId,
        momentId: validatedParams.momentId
      };

      // Get the billing rules from the core API
      const billingRules = await this.getBillingRules(billingRulesParams, authorization);
      // Format the data
      const transformedData = this.processResult(results.data);
      // Set the prices for the orders
      const billableOrders = this.setOrdersPrices(transformedData, billingRules);
      

      // Prepare the response object
      const count = validatedParams.limit;
      const total = results.count;
      const page = validatedParams.page;
      const pageCount = Math.ceil(total / validatedParams.limit);
      const totalAmount = billableOrders.totalAmount; // needs to be added later

      // Create a map to store the orders and the pagination data
      const ordersMap: Map<string, any> = new Map();
      ordersMap.set('orders', billableOrders.orders);
      ordersMap.set('count', count);
      ordersMap.set('page', Number(page));
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
    } catch (error) {
      throw new HttpException(`Error: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    } 
  }

  private validateParamsFromPayload(payload: string): Params {
    try {
      const parsedPayload = JSON.parse(payload);

      // Validate the payload
      if (!parsedPayload ||
        !parsedPayload.shipperId ||
        !parsedPayload.momentId ||
        !parsedPayload.createdAtFrom ||
        !parsedPayload.createdAtTo
      ) {
        throw new HttpException('Los campos Shipper, Momento, Fecha Desde y Fecha Hasta son obligatorios', HttpStatus.BAD_REQUEST);
      }

      // Complete the params object with default values when necessary
      const params: Params = {
        shipperId: parsedPayload.shipperId,
        serviceId: parsedPayload.serviceId || 0,
        productId: parsedPayload.productId || 0,
        impositionPlaceId: parsedPayload.impositionPlaceId || 0,
        trackingId: parsedPayload.trackingId == '0' ? parsedPayload.trackingId : parsedPayload.trackingId + '%',
        chanelledNode: parsedPayload.chanelledNode || '0',
        momentId: parsedPayload.momentId,
        createdAtFrom: parsedPayload.createdAtFrom,
        createdAtTo: parsedPayload.createdAtTo,
        sort: '',
        order: parsedPayload.order || 'DESC',
        limit: parsedPayload.limit || 10,
        offset: parsedPayload.offset || parsedPayload.limit * (parsedPayload.page - 1),
        page: parsedPayload.page || 1,
        selectAll: parsedPayload.selectAll || false,
        orderIds: parsedPayload.orderIds || [],
      };
      return params
    } catch (error) {
      throw new HttpException(`Error validando los parámetros: ${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  private processResult(results: Object[]): any {
    try {
      const transformedData = results.reduce((acc: any[], order: any) => {
          // Check if the order already exists in the transformed data
          let existingOrder = acc.find((o: any) => o.id === order.order_id);

          // If the order doesn't exist, create it
          if (!existingOrder) {
              existingOrder = {
                  id: order.order_id,
                  trackingId: order.order_trackingId,
                  address: order.order_address.trim(),
                  zipCode: order.order_zipCode,
                  province: order.order_province,
                  state: order.order_state,
                  shipper: {
                      id: order.shipper_id,
                      name: order.shipper_name,
                  },
                  service: {
                      id: order.service_id,
                  },
                  chanelledNode: {
                      id: order.chanelledNode_id,
                      name: order.chanelledNode_name,
                  },
                  pieces: [],
                  product: {
                      id: order.product_id,
                      productShippers: [
                          {
                              dimensionalFactor: order.productShipper_dimensionalFactor,
                          },
                      ],
                  },
                  billingRuleId: order.billingRule_id,
                  billingAmount: 0,
                  insuranceValue: 0,
                  insurancePercentage: 0,
                  skip: false,
              };
              acc.push(existingOrder);
          }

          // Create the piece object and add it to the order's pieces array
          const piece = {
              id: order.piece_id,
              SKU: order.piece_SKU,
              height: order.piece_height,
              width: order.piece_width,
              length: order.piece_length,
              weight: order.piece_weight,
              declaredValue: order.piece_declaredValue,
              stagesHistory: [
                  {
                      id: order.stagesHistory_id,
                      createdAt: new Date(order.stagesHistory_createdAt),
                      moment: order.moment_id ? {
                          id: order.moment_id,
                          displayName: order.moment_display_name,
                      } : null,
                  },
              ],
              price: 0, // Needs to be calculated
          };

          // Add the piece to the existing order's pieces array
          existingOrder.pieces.push(piece);

          return acc;
      }, []);

      return transformedData;
    } catch (error) {
      throw new HttpException(`Error procesando data: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async getBillingRules(params: any, authorization: string): Promise<any> {
    try {
      const headers = {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        Authorization: authorization,
        'User-Agent': 'axios/1.7.7'
      }

      // Call the core API to get the matching billing rules
      const url = `${envs.core_api_url}/billing-rules/list`;
      const response$: Promise<AxiosResponse<any>> = this.httpService.get<any>(url, {
        params,
        headers: headers,
      }).toPromise();

      const response = await response$;

      return response.data.data;
    } catch (error) {
      throw new HttpException(`Error obteniendo las reglas de facturación: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private setOrdersPrices(orders: any[], billingRules: any[]): any {
    try {
      let totalAmount = 0;
      for (const order of orders) {
        const rule = billingRules.find((rule) => rule.id === order.billingRuleId);
        let billingAmount = 0;
        if (!!rule) {
          let zone = rule.zone?.find((zone) =>
            isValueBetweenRange({
              value: Number(order.zipCode),
              max: zone.cpminrange, 
              min: zone.cpmaxrange,
            }),
          ) || null;
          if (rule.criterion === CriteriaLabel.ZONA && !zone) {
            order.skip = true;
            continue;
          }
          const variance = rule.variance[0].variance;
          if (variance !== Variances.UNIDADES) {
            for (const piece of order.pieces) {
              let calculatedPrice: number = 0;
              // Check piece weigth
              switch (true){
                case (piece.weight == null || piece.weight == 0):
                  piece.weight = rule.defaultbillableweight;
                  break;
                case (piece.weight < rule.minbillableweight):
                  piece.weight = rule.minbillableweight;
                  break;
                default:
                  break;
              }
              if (rule.criterion === CriteriaLabel.ZONA) {
                calculatedPrice = calculatePieceBillingAmountByWeight({
                  piece,
                  prices: rule.prices.filter(
                    (p) => p.zone === zone.name,
                  ),
                  variance,
                  dimensionalFactor:
                    order.product.productShippers[0].dimensionalFactor,
                });
              } else if (rule.criterion === CriteriaLabel.NODO) {
                calculatedPrice = calculatePieceBillingAmountByWeight({
                  piece,
                  prices: rule.prices.filter(
                    (p) => p.node === order.chanelledNode.name,
                  ),
                  variance,
                  dimensionalFactor:
                    order.product.productShippers[0].dimensionalFactor,
                });
              }
              piece.price = calculatedPrice;
              billingAmount += calculatedPrice;
            }
          } else {
            let calculatedPrice = 0;
            if (rule.criterion === CriteriaLabel.ZONA) {
              calculatedPrice = calculatePriceByVariance({
                prices: rule.prices.filter((p) => p.zone === zone.name),
                weight: order.pieces.length,
              });
            } else if (rule.criterion === CriteriaLabel.NODO) {
              calculatedPrice = calculatePriceByVariance({
                prices: rule.prices.filter(
                  (p) => p.node === order.chanelledNode.name,
                ),
                weight: order.pieces.length,
              });
            }
            billingAmount += calculatedPrice;
          }
          // Calculate insurance value
          let piecesInsuranceValue: number = 0;
          if (rule.hasinsurance){
            for (const piece of order.pieces) {
              switch (true){
                case (piece.declaredValue == null || piece.declaredValue == 0):
                  piece.declaredValue = rule.defaultinsurancevalue;
                  break;
                case (piece.declaredValue < rule.mininsurancevalue):
                  piece.declaredValue = rule.mininsurancevalue;
                  break;
                default:
                  break;
              }
              piecesInsuranceValue += piece.declaredValue * rule.insurancepercentage / 100;
            }
          }
          order.insuranceValue = piecesInsuranceValue;
          order.insurancePercentage = rule.insurancepercentage;
          order.billingAmount = billingAmount;
          totalAmount += billingAmount;
        } else {
          order.skip = true;
        }
      };
      const response = {
          totalAmount: totalAmount,
          orders: orders.filter((order) => !order.skip),
        };
      return response;
    } catch (error) {
      throw new HttpException(`Error calculando precios: ${error.message}`, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
