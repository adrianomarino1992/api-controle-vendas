import FileService from "web_api_base/dist/file/FileService";
import Entity from "./Entity";

export default class Product extends Entity
{   
    public Name : string;
    public Price : number;
    public Storage : number;
    public Active : boolean; 
    public Image? : string;
    
    constructor(name: string, price: number, storage: number, image? : string)
    {
        super();
        this.Name = name;
        this.Price = price;
        this.Storage = storage;
        this.Image = image;
        this.Active = true;        
    }
    
    public async HasImageAsync(): Promise<boolean>
    {
        if(!this.Image)
            return false;

        return await new FileService().FileExistsAsync(this.Image);
    }

}