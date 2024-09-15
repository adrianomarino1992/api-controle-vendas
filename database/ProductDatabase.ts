import Product from "../entities/Product";
import Datababase from "./Database";



export default class ProductDatabase extends Datababase<Product>
{
    
    constructor()
    {
        super(Product);
    }
    
    public async AddAsync(obj: Product): Promise<void> 
    {
        let list = await this.ReadAsync();
        await this.DeleteAsync(obj);
        list.Add(obj);
        await this.SaveAsync(list);
    }

    public async UpdateAsync(obj: Product): Promise<void> 
    {
        await this.AddAsync(obj);
    }

    public async DeleteAsync(obj: Product): Promise<void> 
    {
        let list = await this.ReadAsync();
        await this.DeleteAsync(obj);        
        await this.SaveAsync(list);
    }

    public async QueryAsync(predicate: (o: Product) => boolean): Promise<Product[]> 
    {
        return (await this.ReadAsync()).Where(predicate);
    }

    
}