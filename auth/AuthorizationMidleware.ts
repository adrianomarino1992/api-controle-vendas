import { IHTTPRequestContext } from "web_api_base";
import Token, { TokenUserCategory } from "./Token";


export default async function AuthorizationMidleware(httpContext : IHTTPRequestContext) : Promise<void>
{
    if(httpContext.Request.url.indexOf('/user/login') == 0 || httpContext.Request.url.indexOf('/static') > -1)
        return await httpContext.Next();

    if(!httpContext.Request.headers["api-key"])
    {
        httpContext.Response.status(403);
        httpContext.Response.end();
        return;
    }

    //desenvolvimento
    if(httpContext.Request.headers["api-key"] == "hJ9xVq5LtYu8BmR2gA0pZcN1KsFoWvT6nXeUQ3yMwDPj4bkCSlIr7OGzaEH")
        return await httpContext.Next();

    let tokenHash = httpContext.Request.headers["api-key"];

    let token = Token.Cast(tokenHash);

    if(!token.IsValid)
    {
        httpContext.Response.status(403);
        httpContext.Response.end();
        return;
    }
    
    httpContext.Request["api-token"] = token;
    await httpContext.Next();
   
}

export async function OnlySuperUsers(httpContext : IHTTPRequestContext)
{    
    //desenvolvimento
    if(httpContext.Request.headers["api-key"] == "hJ9xVq5LtYu8BmR2gA0pZcN1KsFoWvT6nXeUQ3yMwDPj4bkCSlIr7OGzaEH")
        return await httpContext.Next();
    
    if(!httpContext.Request["api-token"])
    {
        httpContext.Response.status(403);
        httpContext.Response.end();
        return;
    }
    
    let token = httpContext.Request["api-token"];

    if(!(token instanceof Token))
    {
        httpContext.Response.status(403);
        httpContext.Response.end();
        return;
    }   

    if(token.UserCategory != TokenUserCategory.ADMIN)
    {
        httpContext.Response.status(403);
        httpContext.Response.end();
        return;
    }     

    return await httpContext.Next();

        
}