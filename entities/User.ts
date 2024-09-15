
export default class User 
{
    public Id : string;
    public Name : string;
    public Login : string;
    public Password : string;
    public Active : boolean;

    constructor(name: string, login: string, password: string) 
    {         
        this.Id = `${new Date().getMilliseconds()}_${login}`;
        this.Name = name;
        this.Login = login;
        this.Password = password;
        this.Active = true;
    }

}