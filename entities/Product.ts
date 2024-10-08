import FileService from "web_api_base/dist/file/FileService";
import {CreateMetada} from 'web_api_base';
import Entity from "./Entity";

export default class Product extends Entity
{   
    @CreateMetada()
    public Name : string;

    @CreateMetada()
    public Description : string;

    @CreateMetada()
    public Price : number;

    @CreateMetada()
    public Storage : number;

    @CreateMetada()
    public Active : boolean; 

    @CreateMetada()
    public Image? : string;
    
    constructor(name: string, description : string, price: number, storage: number, image? : string)
    {
        super();
        this.Name = name;
        this.Description = description;
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