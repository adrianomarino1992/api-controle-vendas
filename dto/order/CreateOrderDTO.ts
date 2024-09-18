import DTO from "../DTO";

export default class CreateOrderDTO extends DTO
{
    public UserId: string;
    public Itens : CreateOrderItemDTO[];
    
    constructor(userId : string, itens: CreateOrderItemDTO[])
    {
        super();
        this.UserId = userId;
        this.Itens = itens;
    }
    

    public IsValid(): string[] 
    {
        let validationResult : string[] = [];

        if(!this.UserId)
            validationResult.Add(`O id do usuario é obrigatorio`);

        if(!this.Itens || !this.Itens.Any())
            validationResult.Add(`A lista de itens é obrigatoria`);    

        for(let t of this.Itens)
        {
            (t as any).__proto__ = CreateOrderItemDTO.prototype;
        }
        
        validationResult.AddRange(this.Itens.SelectMany(s => s.IsValid()));
        
        return validationResult;
    }
   

}

export class CreateOrderItemDTO extends DTO
{
    public ProductId : string;
    public ProductName: string;
    public ProductPrice : number;
    public ProductQuantity : number;

    constructor(productId: string, productName: string, productPrice : number, productQuantity: number)
    {
        super();
        this.ProductName = productName;
        this.ProductId = productId;
        this.ProductPrice = productPrice;
        this.ProductQuantity = productQuantity;
    }

    public IsValid(): string[] 
    {
        let validationResult : string[] = [];

        if(!this.ProductId)
            validationResult.Add(`O id do produto é obrigatorio`);

        if(!this.ProductName)
            validationResult.Add(`O nome do produto é obrigatorio`);

        if(!this.ProductPrice)
            validationResult.Add(`O preço do produto é obrigatorio`);

        if(!this.ProductQuantity)
            validationResult.Add(`A quantidade do produto é obrigatorio`);

        return validationResult;
    }

}

