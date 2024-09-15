import { ControllerBase, GET, ActionResult, Validate, POST, PUT, DELETE, File } from "web_api_base";
import Product from "../entities/Product";
import ProductDatabase from "../database/ProductDatabase";



@Validate()
export default class ProductController extends ControllerBase 
{

    private _productDatabase: ProductDatabase;

    constructor() {
        super();
        this._productDatabase = new ProductDatabase;
    }

    @GET('list')
    public async ListAsync(): Promise<ActionResult> 
    {
        return this.OK(await this._productDatabase.ReadAsync());
    }


    @POST('create')
    public async InsertAsync(product: Product): Promise<ActionResult>
    {
        if(!product)
            return this.BadRequest("Informe um produto");

        if(!product.Name || !product.Price)
            return this.BadRequest("O produto deve conter um nome e um preço");

        await this._productDatabase.AddAsync(product);

        return this.NoContent();
    }

    @PUT('update')
    public async UpdateAsync(product: Product): Promise<ActionResult>
    {
        if(!product)
            return this.BadRequest("Informe um produto");

        if(!product.Name || !product.Price)
            return this.BadRequest("O produto deve conter um nome e um preço");

        await this._productDatabase.UpdateAsync(product);

        return this.NoContent();
    }

    @DELETE('delete')
    public async DeleteAsync(productName: string): Promise<ActionResult>
    {
        if(!productName)
            return this.BadRequest("Informe um produto");

        let product = (await this._productDatabase.QueryAsync(s => s.Name == productName)).FirstOrDefault();

        if(!product)
            return this.NotFound(`O produto ${productName} não existe`);

        await this._productDatabase.DeleteAsync(product);

        return this.NoContent();
    }

    @POST('product/img')
    public async UpdateImageAsync(productName: string, image: File) : Promise<ActionResult>
    {
        if(!productName)
            return this.BadRequest("Informe um produto");

        let product = (await this._productDatabase.QueryAsync(s => s.Name == productName)).FirstOrDefault();

        if(!product)
            return this.NotFound(`O produto ${productName} não existe`);

        if(await product.HasImageAsync())
            await this._productDatabase.DeleteImageAsync(product.Image!);

        product.Image = await this._productDatabase.SaveImageAsync(image.Path);

        await this._productDatabase.UpdateAsync(product);

        return this.NoContent();
    }

    @GET('image')
    public GetImage(path : string) : void
    {
        this.Request.sendFile(path);
    }


}
