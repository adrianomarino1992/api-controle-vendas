import Entity from "./Entity";

export default class Order extends Entity
{
    public UserId: string; 
    public Date : Date;
    public Itens : OrderItem[];
    public PaymentDate? : Date;
    public PaymentId? : string;
    public Active : boolean; 
    public UserBalance : number;

    public constructor(userId : string, date: Date)
    {        
        super();
        this.UserId = userId;
        this.Date = date;        
        this.PaymentDate = undefined;
        this.PaymentId = undefined; 
        this.Itens = [];
        this.Active = true;
        this.UserBalance = 0;
    }

    public IsClosed() : boolean
    {
        return this.PaymentDate != undefined && this.PaymentId != undefined;
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
