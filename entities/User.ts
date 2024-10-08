import Entity from "./Entity";
import { FileService } from "web_api_base";

export default class User extends Entity
{
    public Name : string;
    public Login : string;
    public Password : string;
    public Departament : string;
    public Active : boolean;
    public Balance : number;
    public Image? : string;
    public LastPaymante? : Date;

    constructor(name: string, login: string, password: string, departament: string, image? : string) 
    {         
        super();
        this.Name = name;
        this.Login = login;
        this.Password = password;
        this.Departament = departament;
        this.Active = true;
        this.Image = image;
        this.Balance = 0;
        this.LastPaymante = undefined;
    }

    
    public async HasImageAsync(): Promise<boolean>
    {
        if(!this.Image)
            return false;

        return await new FileService().FileExistsAsync(this.Image);
    }

}