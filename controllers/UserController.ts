import { Validate, ControllerBase, GET, ActionResult, POST, PUT, DELETE, InjectTypeArgument, File, ControllerHeader, UseBefore, RunBefore } from "web_api_base";
import Datababase from "../database/Database";
import User from "../entities/User";
import Path from 'path';
import Token from "../auth/Token";
import AuthorizationMidleware, { OnlySuperUsers } from "../auth/AuthorizationMidleware";


@Validate()
@UseBefore(AuthorizationMidleware)
@ControllerHeader('api-key')
export default class UserController extends ControllerBase {

    @InjectTypeArgument(User)
    protected _userDatabase?: Datababase<User>;


    @GET('list-all')
    @RunBefore(OnlySuperUsers)
    public async ListAllAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._userDatabase!.ReadAsync()).OrderBy(s => s.Name));
    }



    @GET('list-active')
    @RunBefore(OnlySuperUsers)
    public async ListActiveAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._userDatabase!.QueryAsync(s => s.Active)).OrderBy(s => s.Name));
    }



    @GET('list-inactive')
    @RunBefore(OnlySuperUsers)
    public async ListInactiveAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._userDatabase!.QueryAsync(s => !s.Active)).OrderBy(s => s.Name));
    }

    

    @GET('login')
    public async LoginAsync(username: string, password : string) : Promise<ActionResult>
    {
        let user = (await this._userDatabase!.QueryAsync(s => s.Login == username && s.Password == password)).FirstOrDefault();

        if(!user)
            return this.NotFound();

        let token = Token.Generate(user);

        return this.OK({User: user, Token : token});
    }



    @POST('create')
    @RunBefore(OnlySuperUsers)
    public async InsertAsync(user: User): Promise<ActionResult> 
    {
        if(!this.CanAlter(user))
        {
            return this.BadRequest('Apesar o desenvolvimento tem permissão para criar esse usuario');
        }

        if (!user)
            return this.BadRequest("Informe um usuario");

        if (!user.Name || !user.Login || !user.Password)
            return this.BadRequest("O usuario deve conter um nome, um login e uma senha");

        let exists = (await this._userDatabase!.QueryAsync(s => s.Name.toLowerCase() == user.Name.toLowerCase())).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O usuario ${user.Name} já existe`);

        exists = (await this._userDatabase!.QueryAsync(s => s.Login.toLowerCase() == user.Login.toLowerCase())).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O  login ${user.Login} já está em uso`);

        await this._userDatabase!.AddAsync(user);

        return this.OK({Id: user.Id});
    }





    @PUT('update')
    @RunBefore(OnlySuperUsers)
    public async UpdateAsync(user: User): Promise<ActionResult> 
    {
        if(!this.CanAlter(user))
        {
            return this.BadRequest('Apesar o desenvolvimento tem permissão para alterar esse usuario');
        }

        if (!user)
            return this.BadRequest("Informe um usuario");

        if (!user.Name || !user.Login || !user.Password)
            return this.BadRequest("O usuario deve conter um nome, um login e uma senha");

        let exists = (await this._userDatabase!.QueryAsync(
            s => s.Name.toLowerCase() == user.Name.toLowerCase() && 
            s.Id != user.Id
        )).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O usuario ${user.Name} já existe`);

        exists = (await this._userDatabase!.QueryAsync(
            s => s.Login.toLowerCase() == user.Login.toLowerCase() && 
            s.Id != user.Id
        )).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O login ${user.Login} já está em uso`);

        exists = (await this._userDatabase!.QueryAsync(s => s.Id == user.Id)).FirstOrDefault();

        if (!exists)
            return this.BadRequest(`O usuario ${user.Name} não existe`);

        user.Image = exists.Image;

        await this._userDatabase!.UpdateAsync(user);

        return this.NoContent();
    }






    @DELETE('delete')
    @RunBefore(OnlySuperUsers)
    public async DeleteAsync(userId: string): Promise<ActionResult> 
    {
        if (!userId)
            return this.BadRequest("Informe um id");

        let user = (await this._userDatabase!.QueryAsync(s => s.Id == userId)).FirstOrDefault();

        if (!user)
            return this.NotFound(`O usuario não existe`);

        user.Active = false;

        await this._userDatabase!.UpdateAsync(user);

        return this.NoContent();
    }



    

    @POST('set-image')
    public async UpdateImageAsync(userId: string, image: File) : Promise<ActionResult>
    {
        if(!userId)
            return this.BadRequest("Informe um usuario");

        let user = (await this._userDatabase!.QueryAsync(s => s.Id.toLowerCase() == userId.toLowerCase())).FirstOrDefault();

        if(!user)
            return this.NotFound(`O usuario não existe`);

        if(await user.HasImageAsync())
            await this._userDatabase!.DeleteImageAsync(user.Image!);

        user.Image = await this._userDatabase!.SaveImageAsync(image.Path);

        await this._userDatabase!.UpdateAsync(user);

        return this.NoContent();
    }





    @GET('static/get-image')
    public async GetImageAsync(userId: string) : Promise<ActionResult>
    {
        if(!userId)
            return this.BadRequest("Informe um usuario");

        let user = (await this._userDatabase!.QueryAsync(s => s.Id.toLowerCase() == userId.toLowerCase())).FirstOrDefault();

        if(!user)
            return this.NotFound(`O usuario não existe`);

        if(!await user.HasImageAsync())
            return this.SendFile(Path.join(__dirname, "..", "assets", "default.png"));
        
        return this.SendFile(user.Image!);            
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



    
    
    public CanAlter(user : User)
    {
        let isDeveloper = this.Request.headers["api-key"] == "hJ9xVq5LtYu8BmR2gA0pZcN1KsFoWvT6nXeUQ3yMwDPj4bkCSlIr7OGzaEH";
        
        if(user.Name.toLowerCase() == "developer")
        {
            if(!isDeveloper)
                return false;
        }

        if(user.Login.toLowerCase() == "dev")
        {
            if(!isDeveloper)
                return false;
        }

        return true;
    }


}





