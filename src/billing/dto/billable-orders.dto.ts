class BillableOrdersDto {
    id: string;
    trackingId: string;
    address: string;
    zipCode: string;
    province: string;
    state: string;
    shipper: {
        id: string;
        name: string;
    };
    service: {
        id: string;
    };
    chanelledNode: {
        id: string;
        name: string;
    };
    pieces: Piece[];
    product: {
        id: string;
        productShippers: {
          dimensionalFactor: number;
        }[];
    };
    billingRuleId: string;
    billingAmount: number;
    insuranceValue: number;
    insurancePercentage: number;
    skip: boolean;
}

class Piece {
    id: string;
    SKU: string;
    height: number;
    width: number;
    length: number;
    weight: number;
    declaredValue: number;
    stagesHistory: StagesHistory[];
    price: number;
};

class StagesHistory {
    id: string;
    createdAt: string;
    moment: {
        id: string;
        display_name: string;
    };
};

export { BillableOrdersDto, Piece, StagesHistory };