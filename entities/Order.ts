import FileService from "web_api_base/dist/file/FileService";

export default class Order 
{
    public UserId: string; 
    public Date : Date;
    public Status : OrderStatus;
    public PaymentDate? : Date;
    public PaymentImagePath? : string;
    	
    public constructor(userId : string, date: Date)
    {
        this.UserId = userId;
        this.Date = date;
        this.Status = OrderStatus.OPEN;
        this.PaymentDate = undefined;
        this.PaymentImagePath = undefined; 
    }

    public IsClosed()
    {
        return this.Status = OrderStatus.CLOSED;
    }

    public async HasImageAsync(): Promise<boolean>
    {
        if(!this.PaymentImagePath)
            return false;

        return await new FileService().FileExistsAsync(this.PaymentImagePath);
    }
}


export class OrderItem
{
    public ProductName : string;
    public Price : number;
    public Quantity : number;
    

    constructor(productName : string, price : number, quantity: number)
    {
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