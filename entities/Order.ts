import FileService from "web_api_base/dist/file/FileService";
import Entity from "./Entity";

export default class Order extends Entity
{
    public UserId: string; 
    public Date : Date;
    public Itens : OrderItem[];
    public Status : OrderStatus;
    public PaymentDate? : Date;
    public PaymentImagePath? : string;
    public Active : boolean; 

    public constructor(userId : string, date: Date)
    {        
        super();
        this.UserId = userId;
        this.Date = date;
        this.Status = OrderStatus.OPEN;
        this.PaymentDate = undefined;
        this.PaymentImagePath = undefined; 
        this.Itens = [];
        this.Active = true;
    }

    public IsClosed() : boolean
    {
        return this.Status == OrderStatus.CLOSED;
    }

    public async HasImageAsync(): Promise<boolean>
    {
        if(!this.PaymentImagePath)
            return false;

        return await new FileService().FileExistsAsync(this.PaymentImagePath);
    }
}


export class OrderItem extends Entity
{
    public ProductId: string;
    public ProductName : string;
    public Price : number;
    public Quantity : number;
    

    constructor(productId: string, productName : string, price : number, quantity: number)
    {
        super();
        this.ProductId = productId;
        this.ProductName = productName;
        this.Price = price;
        this.Quantity = quantity;        
    }
}

export enum OrderStatus 
{
    OPEN = 'OPEN', 
    CLOSED = 'CLOSED'
}