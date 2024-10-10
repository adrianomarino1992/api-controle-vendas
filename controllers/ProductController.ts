import { ControllerBase, GET, ActionResult, Validate, POST, PUT, DELETE, File, InjectTypeArgument, ControllerHeader, UseBefore, RunBefore } from "web_api_base";
import Product from "../entities/Product";
import Datababase from "../database/Database";
import Path from 'path';
import AuthorizationMidleware, { OnlySuperUsers } from "../auth/AuthorizationMidleware";


@Validate()
@UseBefore(AuthorizationMidleware)
@ControllerHeader('api-key')
export default class ProductController extends ControllerBase 
{

    @InjectTypeArgument(Product)
    private _productDatabase?: Datababase<Product>;

    @GET('list-all')
    @RunBefore(OnlySuperUsers)
    public async ListAllAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._productDatabase!.ReadAsync()).OrderBy(s => s.Name));
    }


    @GET('list-active')
    public async ListActiveAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._productDatabase!.QueryAsync(s => s.Active)).OrderBy(s => s.Name));
    }



    @GET('list-inactive')
    @RunBefore(OnlySuperUsers)
    public async ListInactiveAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._productDatabase!.QueryAsync(s => !s.Active)).OrderBy(s => s.Name));
    }

    


    @POST('create')
    @RunBefore(OnlySuperUsers)
    public async InsertAsync(product: Product): Promise<ActionResult>
    {
        if(!product)
            return this.BadRequest("Informe um produto");

        if(!product.Name || !product.Price)
            return this.BadRequest("O produto deve conter um nome e um preço");

        let exists = (await this._productDatabase!.QueryAsync(s => s.Name.toLowerCase() == product.Name.toLowerCase())).FirstOrDefault();

        if(exists)
            return this.BadRequest(`O produto ${product.Name} já existe`);

        await this._productDatabase!.AddAsync(product);

        return this.OK({Id: product.Id});
    }





    @PUT('update')
    @RunBefore(OnlySuperUsers)
    public async UpdateAsync(product: Product): Promise<ActionResult>
    {
        if(!product)
            return this.BadRequest("Informe um produto");

        if(!product.Name || !product.Price)
            return this.BadRequest("O produto deve conter um nome e um preço");

        let exists = (await this._productDatabase!.QueryAsync(
            s => s.Name.toLowerCase() == product.Name.toLowerCase() &&
            s.Id != product.Id
        )).FirstOrDefault();

        if(exists)
            return this.BadRequest(`O produto ${product.Name} já existe`);

        exists = (await this._productDatabase!.QueryAsync(s => s.Id == product.Id)).FirstOrDefault();

        if(!exists)
            return this.BadRequest(`O produto ${product.Name} não existe`);

        product.Image = exists.Image;

        await this._productDatabase!.UpdateAsync(product);

        return this.NoContent();
    }





    @DELETE('delete')
    @RunBefore(OnlySuperUsers)
    public async DeleteAsync(productId: string): Promise<ActionResult>
    {
        if(!productId)
            return this.BadRequest("Informe um produto");

        let product = (await this._productDatabase!.QueryAsync(s => s.Id.toLowerCase() == productId.toLowerCase())).FirstOrDefault();

        if(!product)
            return this.NotFound(`O produto não existe`);

        product.Active = false;

        await this._productDatabase!.UpdateAsync(product);

        return this.NoContent();
    }





    @POST('set-image')
    @RunBefore(OnlySuperUsers)
    public async UpdateImageAsync(productId: string, image: File) : Promise<ActionResult>
    {
        if(!productId)
            return this.BadRequest("Informe um produto");

        let product = (await this._productDatabase!.QueryAsync(s => s.Id.toLowerCase() == productId.toLowerCase())).FirstOrDefault();

        if(!product)
            return this.NotFound(`O produto não existe`);

        if(await product.HasImageAsync())
            await this._productDatabase!.DeleteImageAsync(product.Image!);

        product.Image = await this._productDatabase!.SaveImageAsync(image.Path);

        await this._productDatabase!.UpdateAsync(product);

        return this.NoContent();
    }





    @GET('static/get-image')
    public async GetImageAsync(productId: string) : Promise<ActionResult>
    {
        if(!productId)
            return this.BadRequest("Informe um produto");

        let product = (await this._productDatabase!.QueryAsync(s => s.Id.toLowerCase() == productId.toLowerCase())).FirstOrDefault();

        if(!product)
            return this.NotFound(`O produto não existe`);

        if(!await product.HasImageAsync())
            return this.SendFile(Path.join(__dirname, "..", "assets", "default.png"));
        
        return this.SendFile(product.Image!);            
    }

    
    @GET('static/get-default-image')
    public async GetDefaultImageAsync() : Promise<ActionResult>
    {
        return this.SendFile(Path.join(__dirname, "..", "assets", "default.png"));           
    }

    @GET('static/get-new-image')
    public async GetNewImageAsync() : Promise<ActionResult>
    {
        return this.SendFile(Path.join(__dirname, "..", "assets", "new.png"));           
    }



}





