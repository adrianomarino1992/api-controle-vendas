import User from "../entities/User";
import BasicCryp from "./BasicCryp";

export enum TokenUserCategory 
{
    ADMIN = 'ADMIN', 
    COMUM = 'COMUM'
}

export default class Token 
{

    public User : string = "";
    public UserCategory : TokenUserCategory = TokenUserCategory.COMUM;
    public ExpiresAt : Date = new Date();
    public IsValid : boolean = false;

    public SetValidStatus(valid : boolean)
    {
        this.IsValid = valid;
        return this;
    }

    public static Generate(user : User) : string
    {
       let token : Token = new Token();
       token.User = user.Login;
       token.UserCategory = (user.Name == "ADMIN" || user.Name == "DEVELOPER") ? TokenUserCategory.ADMIN : TokenUserCategory.COMUM;
       token.ExpiresAt = new Date();
       token.ExpiresAt.setHours(new Date().getHours() + 1);      
       
       return BasicCryp.Encode(JSON.stringify(token));

    }

    public static Cast(hash : string)
    {
        if(!hash)
            return new Token();

        let decoded = BasicCryp.Decode(hash);

        try{

            let tokenJson = JSON.parse(decoded);

            let token = new Token();
            Object.assign(token, tokenJson);

            let expiresAt = new Date(token.ExpiresAt);

            if(token.User && token.UserCategory && expiresAt > new Date())
                return token.SetValidStatus(true);
            else
                return token.SetValidStatus(false);

        }catch(e)
        {   
            return new Token().SetValidStatus(false);
        }
    }
}
