import MD5 from "md5";
import Entity from "./Entity";

export default class User extends Entity
{
    public Name : string;
    public Login : string;
    public Password : string;
    public Active : boolean;

    constructor(name: string, login: string, password: string) 
    {         
        super();
        this.Name = name;
        this.Login = login;
        this.Password = password;
        this.Active = true;
    }

}