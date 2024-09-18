import { Validate, ControllerBase, GET, ActionResult, POST, PUT, DELETE, File, RequestJson } from "web_api_base";
import Datababase from "../database/Database";
import Order, { OrderItem, OrderStatus } from "../entities/Order";
import Product from "../entities/Product";
import User from "../entities/User";
import CreateOrderDTO from "../dto/order/CreateOrderDTO";
import UpdateOrderDTO from "../dto/order/UpdateOrderDTO";
import CreateTemplate from "../dto/CreateTemplate";


@Validate()
export default class OrderController extends ControllerBase {

    private _orderDatabase: Datababase<Order>;
    private _productDatabase: Datababase<Product>;
    private _userDatabase: Datababase<User>;

    constructor() 
    {
        super();
        this._orderDatabase = new Datababase(Order);
        this._productDatabase = new Datababase(Product);
        this._userDatabase = new Datababase(User);
    }



    @GET('list-all')
    public async ListAllAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._orderDatabase.ReadAsync()).OrderByDescending(s => s.Date));
    }



    @GET('list-opens')
    public async ListOpenAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._orderDatabase.QueryAsync(s => s.Active && !s.IsClosed())).OrderByDescending(s => s.Date));
    }



    @GET('list-closeds')
    public async ListClosedsAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._orderDatabase.QueryAsync(s => s.Active && s.IsClosed())).OrderByDescending(s => s.Date));
    }
    

    @GET('list-by-user')
    public async ListBYUserAsync(userId: string): Promise<ActionResult> 
    {
        if (!userId)
            return this.BadRequest("Informe um id");

        let user = (await this._userDatabase.QueryAsync(s => s.Id == userId)).FirstOrDefault();

        if (!user)
            return this.NotFound(`O usuario não existe`);

        return this.OK(await this._orderDatabase.QueryAsync(s => s.UserId == userId));
    }




    @RequestJson(CreateTemplate.CreateTemplate(CreateOrderDTO))
    @POST('create')
    public async InsertAsync(orderDTO: CreateOrderDTO): Promise<ActionResult> 
    {
       
        let validations = orderDTO.IsValid();

        if(validations.Any())
            return this.BadRequest(validations);

        let produtos = await this._productDatabase.ReadAsync();

        let orderItens : OrderItem[] = [];      
        

        for(let item of orderDTO.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);

            if(!productOnDatabase)
                return this.BadRequest(`O produto ${item.ProductName} não existe`);
            
            productOnDatabase.Storage -= item.ProductQuantity;

            this._productDatabase.UpdateAsync(productOnDatabase);

            orderItens.Add(
                new OrderItem(
                    productOnDatabase.Id,
                    productOnDatabase.Name,
                    productOnDatabase.Price,
                    item.ProductQuantity
                )
            );

        }

        let order : Order = new Order(orderDTO.UserId, new Date());
        order.Itens = orderItens;
        
        await this._orderDatabase.AddAsync(order);

        return this.NoContent();
    }





    @PUT('update')
    public async UpdateAsync(orderDTO: UpdateOrderDTO): Promise<ActionResult> 
    {   
        let validations = orderDTO.IsValid();

        if(validations.Any())
            return this.BadRequest(validations);

        let orderONDatabase = (await this._orderDatabase.QueryAsync(s => s.Id == orderDTO.Id)).FirstOrDefault();

        if(!orderONDatabase)
            return this.NotFound('O pedido não existe');

        let produtos = await this._productDatabase.ReadAsync();

        for(let item of orderONDatabase.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);

            if(productOnDatabase)
            {
                productOnDatabase.Storage += item.Quantity; 
                this._productDatabase.UpdateAsync(productOnDatabase);
            }

        }

        let orderItens : OrderItem[] = [];      

        for(let item of orderDTO.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);

            if(!productOnDatabase)
                return this.BadRequest(`O produto ${item.ProductName} não existe`);            
            
            productOnDatabase.Storage -= item.ProductQuantity;

            this._productDatabase.UpdateAsync(productOnDatabase);

            orderItens.Add(
                new OrderItem(
                    productOnDatabase.Id,
                    productOnDatabase.Name,
                    productOnDatabase.Price,
                    item.ProductQuantity
                )
            );

        }

        let order : Order = new Order(orderDTO.UserId, new Date());
        order.Id = orderDTO.Id;
        order.Itens = orderItens;
        
        await this._orderDatabase.UpdateAsync(order);

        return this.NoContent();

    }





    @DELETE('delete')
    public async DeleteAsync(orderId: string): Promise<ActionResult> 
    {
        if (!orderId)
            return this.BadRequest("Informe um id");

        let order = (await this._orderDatabase.QueryAsync(s => s.Id == orderId)).FirstOrDefault();

        if (!order)
            return this.NotFound(`O usuario não existe`);

        order.Active = false;

        await this._orderDatabase.UpdateAsync(order);

        let produtos = await this._productDatabase.ReadAsync();

        for(let item of order.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);
    
            if(productOnDatabase)
            {
                productOnDatabase.Storage += item.Quantity; 
                this._productDatabase.UpdateAsync(productOnDatabase);
            }    
        }

        return this.NoContent();
    }


    

    @POST('pay-order')
    public async PayOrderAsync(orderId: string, image: File) : Promise<ActionResult>
    {
        if (!orderId)
            return this.BadRequest("Informe um id");

        let order = (await this._orderDatabase.QueryAsync(s => s.Id == orderId)).FirstOrDefault();

        if (!order)
            return this.NotFound(`O pedido não existe`);

        if(order.IsClosed() && await order.HasImageAsync())
            return this.BadRequest("O pedido já está pago");

        if(await order.HasImageAsync())
            await this._orderDatabase.DeleteImageAsync(order.PaymentImagePath!);

        order.PaymentImagePath = await this._orderDatabase.SaveImageAsync(image.Path);
        order.Status = OrderStatus.CLOSED;

        await this._orderDatabase.UpdateAsync(order);

        return this.NoContent();
    }





    @GET('get-image')
    public async GetImageAsync(orderId: string) : Promise<ActionResult>
    {
         if (!orderId)
            return this.BadRequest("Informe um id");

        let order = (await this._orderDatabase.QueryAsync(s => s.Id == orderId)).FirstOrDefault();

        if (!order)
            return this.NotFound(`O pedido não existe`);

        if(!await order.HasImageAsync())
            return this.NotFound("O pedido não possui imagens");
        
        return this.SendFile(order.PaymentImagePath!);            
    }


}
