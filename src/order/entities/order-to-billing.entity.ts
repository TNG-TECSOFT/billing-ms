import {
    BaseEntity,
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToMany,
    ManyToOne,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
  } from 'typeorm';

  @Entity()
  export class OrderToBilling extends BaseEntity{
    @PrimaryGeneratedColumn()
    id: number;

    @Column({nullable: false})
    toMonth: number;

    @Column({nullable: false})
    toYear: number;

    @Column({nullable: false})
    shipperId: number;

    @Column({nullable: false})
    createdAt: Date;

    @Column({nullable: false})
    createdBy: string;

    @Column({nullable: false})
    orderId: number;

    @Column({nullable: false})
    productId: number;

    @Column({nullable: false})
    serviceId: number;

    @Column({nullable: true})
    trackingId: string;

    @Column({nullable: false})
    productSku: string;

    @Column({nullable: false})
    productInsuranceSku: string;

    @Column({nullable: false})
    quantity: number;

    @Column({nullable: true})
    insuranceSku: number;

    @Column({nullable: true})
    insurancePercentage: number;

    @Column({nullable: false})
    insuranceValue: number;

    @Column({nullable: false})
    unitPrice: number;

    @Column({nullable: false})
    lineTotal: number;

    @Column({nullable: true})
    shippingPercentage: number;

    @Column({nullable: false})
    shippingValue: Number;

    @Column({nullable: true})
    sendAt: Date;

    @Column({nullable: true})
    sendBy: Date;

    @Column({nullable: false})
    invoiceType: string;

    @Column({nullable: false})
    invoiceNo: string;

    @Column({nullable: false})
    notifyInvoiceAt: Date;

    @Column({nullable: false})
    notifyInvoiceBy: string;
  }