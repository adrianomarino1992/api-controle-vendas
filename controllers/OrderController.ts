import { Validate, ControllerBase, GET, ActionResult, POST, PUT, DELETE, File, RequestJson, InjectTypeArgument, UseBefore, ControllerHeader, RunBefore } from "web_api_base";
import Datababase from "../database/Database";
import Order, { OrderItem } from "../entities/Order";
import Product from "../entities/Product";
import User from "../entities/User";
import Payment from "../entities/Payment";
import CreateOrderDTO from "../dto/order/CreateOrderDTO";
import UpdateOrderDTO from "../dto/order/UpdateOrderDTO";
import CreateTemplate from "../dto/CreateTemplate";
import { HistoryDTO } from "../dto/order/HistoryDTO";
import AuthorizationMidleware, { OnlySuperUsers } from "../auth/AuthorizationMidleware";


@Validate()
@UseBefore(AuthorizationMidleware)
@ControllerHeader('api-key')
export default class OrderController extends ControllerBase {

    @InjectTypeArgument(Order)
    private _orderDatabase?: Datababase<Order>;

    @InjectTypeArgument(Product)
    private _productDatabase?: Datababase<Product>;
    
    @InjectTypeArgument(User)
    private _userDatabase?: Datababase<User>;    

    @InjectTypeArgument(Payment)
    private _paymentDatabase?: Datababase<Payment>;  


    @GET('list-all')
    @RunBefore(OnlySuperUsers)
    public async ListAllAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._orderDatabase!.ReadAsync()).OrderByDescending(s => s.Date));
    }


    @GET('list-opens')
    @RunBefore(OnlySuperUsers)
    public async ListOpenAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._orderDatabase!.QueryAsync(s => s.Active && !s.IsClosed())).OrderByDescending(s => s.Date));
    }

    
    @GET('list-closeds')
    @RunBefore(OnlySuperUsers)
    public async ListClosedsAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._orderDatabase!.QueryAsync(s => s.Active && s.IsClosed())).OrderByDescending(s => s.Date));
    }

    
    @GET('history-by-user')
    public async GetHistoryByUser(userId: string): Promise<ActionResult> 
    {
        if (!userId)
            return this.BadRequest("Informe um id");

        let user = (await this._userDatabase!.QueryAsync(s => s.Id == userId)).FirstOrDefault();

        if (!user)
            return this.NotFound(`O usuario não existe`);

        let orders = await this._orderDatabase!.QueryAsync(s => s.UserId == userId);
        let payments = await this._paymentDatabase!.QueryAsync(s => s.UserId == userId);

        let itensOrdeneds : any[] = [];

        itensOrdeneds.AddRange(orders);
        itensOrdeneds.AddRange(payments);

        itensOrdeneds = itensOrdeneds.OrderBy(s => {

            if(s instanceof Order)
                return new Date(s.Date);
            else
                return new Date((s as Payment).Date);
        });

        let data : HistoryDTO[] = [];

        for(let i of itensOrdeneds)
        {
            let dto = new HistoryDTO();
            if(i instanceof Order)
            {
                dto.Date = i.Date;
                dto.PaymentDate = i.PaymentDate;
                dto.Id = i.Id;
                dto.IsPayment = false;
                dto.ProdutcId = i.Itens[0].ProductId;
                dto.ProductName = i.Itens[0].ProductName;
                dto.ProdutcPrice = i.Itens[0].Price;
                dto.UserBalance = i.UserBalance;
            }
            else 
            {
                let p = i as Payment;
                dto.PaymentDate = p.Date;
                dto.Date = p.Date;
                dto.Id = p.Id;
                dto.IsPayment = true;
                dto.UserBalance = 0;                
            }

            data.Add(dto);
            
        }

        return this.OK(data);
    }
    



    @GET('list-by-user')
    public async ListBYUserAsync(userId: string): Promise<ActionResult> 
    {
        if (!userId)
            return this.BadRequest("Informe um id");

        let user = (await this._userDatabase!.QueryAsync(s => s.Id == userId)).FirstOrDefault();

        if (!user)
            return this.NotFound(`O usuario não existe`);

        return this.OK((await this._orderDatabase!.QueryAsync(s => s.UserId == userId)).OrderBy(s => s.Date));
    }




    @RequestJson(CreateTemplate.CreateTemplate(CreateOrderDTO))
    @POST('create')
    public async InsertAsync(orderDTO: CreateOrderDTO): Promise<ActionResult> 
    {
       
        let validations = orderDTO.IsValid();

        if(validations.Any())
            return this.BadRequest(validations);

        let produtos = await this._productDatabase!!.ReadAsync();

        let orderItens : OrderItem[] = [];      

        let user = (await this._userDatabase?.QueryAsync(s => s.Id == orderDTO.UserId))!.FirstOrDefault();

        if(!user)
            return this.BadRequest("Usuario não existe");        
        

        for(let item of orderDTO.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);

            if(!productOnDatabase)
                return this.BadRequest(`O produto ${item.ProductName} não existe`);
            
            productOnDatabase.Storage -= item.ProductQuantity;

            this._productDatabase!!.UpdateAsync(productOnDatabase);

            orderItens.Add(
                new OrderItem(
                    productOnDatabase.Id,
                    productOnDatabase.Name,
                    productOnDatabase.Price,
                    item.ProductQuantity
                )
            );

        }

        user.Balance += orderItens.Sum(s => s.Price);

        let order : Order = new Order(orderDTO.UserId, new Date());
        order.Itens = orderItens;
        order.UserBalance = user.Balance;
        
        await this._orderDatabase!.AddAsync(order);
        await this._userDatabase?.UpdateAsync(user);

        return this.NoContent();
    }





    @PUT('update')
    @RunBefore(OnlySuperUsers)
    public async UpdateAsync(orderDTO: UpdateOrderDTO): Promise<ActionResult> 
    {   
        let validations = orderDTO.IsValid();

        if(validations.Any())
            return this.BadRequest(validations);

        let orderONDatabase = (await this._orderDatabase!.QueryAsync(s => s.Id == orderDTO.Id)).FirstOrDefault();

        if(!orderONDatabase)
            return this.NotFound('O pedido não existe');

        let produtos = await this._productDatabase!.ReadAsync();

        let user = (await this._userDatabase?.QueryAsync(s => s.Id == orderDTO.UserId))!.FirstOrDefault();

        if(!user)
            return this.BadRequest("Usuario não existe");  

        for(let item of orderONDatabase.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);

            if(productOnDatabase)
            {
                productOnDatabase.Storage += item.Quantity; 
                user.Balance -= item.Price;
                this._productDatabase!.UpdateAsync(productOnDatabase);
            }

        }

        let orderItens : OrderItem[] = [];      

        for(let item of orderDTO.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);

            if(!productOnDatabase)
                return this.BadRequest(`O produto ${item.ProductName} não existe`);            
            
            productOnDatabase.Storage -= item.ProductQuantity;
            user.Balance += productOnDatabase.Price;

            this._productDatabase!.UpdateAsync(productOnDatabase);

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
        order.UserBalance = user.Balance;
        await this._orderDatabase!.UpdateAsync(order);
        await this._userDatabase?.UpdateAsync(user);

        return this.NoContent();

    }





    @DELETE('delete')
    @RunBefore(OnlySuperUsers)
    public async DeleteAsync(orderId: string): Promise<ActionResult> 
    {
        if (!orderId)
            return this.BadRequest("Informe um id");

        let order = (await this._orderDatabase!.QueryAsync(s => s.Id == orderId)).FirstOrDefault();

        if (!order)
            return this.NotFound(`O usuario não existe`);

        let user = (await this._userDatabase?.QueryAsync(s => s.Id == order.UserId))!.FirstOrDefault();

        if(!user)
            return this.BadRequest("Usuario não existe");  

        order.Active = false;
        

        let produtos = await this._productDatabase!.ReadAsync();

        for(let item of order.Itens)
        {
            let productOnDatabase = produtos.FirstOrDefault(s => s.Id == item.ProductId);
    
            if(productOnDatabase)
            {
                productOnDatabase.Storage += item.Quantity; 
                user.Balance -= item.Price;
                await this._productDatabase!.UpdateAsync(productOnDatabase);
            }    
        }

        order.UserBalance = user.Balance;
        await this._orderDatabase!.UpdateAsync(order);

        await this._userDatabase?.UpdateAsync(user);

        return this.NoContent();
    }


    

    @POST('pay-order')
    public async PayOrderAsync(payment : Payment) : Promise<ActionResult>
    {
        if (!payment.UserId)
            return this.BadRequest("Informe o usuario");

        payment.Date = new Date();

        let user = (await this._userDatabase!.QueryAsync(s => s.Id == payment.UserId)).FirstOrDefault();

        if (!user)
            return this.NotFound(`O usaurio não existe`);

        let orders = await this._orderDatabase!.QueryAsync(s => s.UserId == payment.UserId && !s.PaymentId);

        user.Balance = 0;
        user.LastPaymante = new Date();

        await this._paymentDatabase?.AddAsync(payment);
        await this._userDatabase?.UpdateAsync(user);

        for(let o of orders)
        {
            o.PaymentDate = new Date();
            o.PaymentId = payment.Id;
            await this._orderDatabase?.UpdateAsync(o);
        }

        return this.OK({Id : payment.Id});
    }


    @POST('set-image')
    public async UpdateImageAsync(paymentId: string, image: File) : Promise<ActionResult>
    {
        if(!paymentId)
            return this.BadRequest("Informe o id do pagamento");

        let payment = (await this._paymentDatabase!.QueryAsync(s => s.Id.toLowerCase() == paymentId.toLowerCase())).FirstOrDefault();

        if(!payment)
            return this.NotFound(`O pagamento não existe`);

        if(await payment.HasImageAsync())
            await this._paymentDatabase!.DeleteImageAsync(payment.ImagePath!);

        payment.ImagePath = await this._paymentDatabase!.SaveImageAsync(image.Path);

        await this._paymentDatabase!.UpdateAsync(payment);

        return this.NoContent();
    }



    @GET('static/get-image')
    public async GetImageAsync(paymentId: string) : Promise<ActionResult>
    {
         if (!paymentId)
            return this.BadRequest("Informe um id");

        let payment = (await this._paymentDatabase!.QueryAsync(s => s.Id == paymentId)).FirstOrDefault();

        if (!payment)
            return this.NotFound(`O pagamento não existe`);

        if(!await payment.HasImageAsync())
            return this.NotFound("O pagamento não possui imagens");
        
        return this.SendFile(payment.ImagePath!);            
    }

    
    @GET('static/download-image')
    public async DownloadImageAsync(paymentId: string) : Promise<ActionResult>
    {
         if (!paymentId)
            return this.BadRequest("Informe um id");

        let payment = (await this._paymentDatabase!.QueryAsync(s => s.Id == paymentId)).FirstOrDefault();

        if (!payment)
            return this.NotFound(`O pagamento não existe`);

        if(!await payment.HasImageAsync())
            return this.NotFound("O pagamento não possui imagens");
        
        return this.DownloadFile(payment.ImagePath!);            
    }


}
