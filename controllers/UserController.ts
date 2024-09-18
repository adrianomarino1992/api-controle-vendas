import { Validate, ControllerBase, GET, ActionResult, POST, PUT, DELETE } from "web_api_base";
import Datababase from "../database/Database";
import User from "../entities/User";




@Validate()
export default class UserController extends ControllerBase {

    private _userDatabase: Datababase<User>;

    constructor() {
        super();
        this._userDatabase = new Datababase(User);
    }




    @GET('list-all')
    public async ListAllAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._userDatabase.ReadAsync()).OrderBy(s => s.Name));
    }




    @GET('list-active')
    public async ListActiveAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._userDatabase.QueryAsync(s => s.Active)).OrderBy(s => s.Name));
    }

    


    @GET('list-inactive')
    public async ListInactiveAsync(): Promise<ActionResult> 
    {
        return this.OK((await this._userDatabase.QueryAsync(s => !s.Active)).OrderBy(s => s.Name));
    }

    





    @POST('create')
    public async InsertAsync(user: User): Promise<ActionResult> 
    {
        if (!user)
            return this.BadRequest("Informe um usuario");

        if (!user.Name || !user.Login || !user.Password)
            return this.BadRequest("O usuario deve conter um nome, um login e uma senha");

        let exists = (await this._userDatabase.QueryAsync(s => s.Name.toLowerCase() == user.Name.toLowerCase())).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O usuario ${user.Name} já existe`);

        exists = (await this._userDatabase.QueryAsync(s => s.Login.toLowerCase() == user.Login.toLowerCase())).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O  login ${user.Login} já está em uso`);

        await this._userDatabase.AddAsync(user);

        return this.NoContent();
    }






    @PUT('update')
    public async UpdateAsync(user: User): Promise<ActionResult> 
    {
        if (!user)
            return this.BadRequest("Informe um usuario");

        if (!user.Name || !user.Login || !user.Password)
            return this.BadRequest("O usuario deve conter um nome, um login e uma senha");

        let exists = (await this._userDatabase.QueryAsync(
            s => s.Name.toLowerCase() == user.Name.toLowerCase() && 
            s.Id != user.Id
        )).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O usuario ${user.Name} já existe`);

        exists = (await this._userDatabase.QueryAsync(
            s => s.Login.toLowerCase() == user.Login.toLowerCase() && 
            s.Id != user.Id
        )).FirstOrDefault();

        if (exists)
            return this.BadRequest(`O login ${user.Login} já está em uso`);

        exists = (await this._userDatabase.QueryAsync(s => s.Id == user.Id)).FirstOrDefault();

        if (!exists)
            return this.BadRequest(`O usuario ${user.Name} não existe`);

        await this._userDatabase.UpdateAsync(user);

        return this.NoContent();
    }






    @DELETE('delete')
    public async DeleteAsync(userId: string): Promise<ActionResult> 
    {
        if (!userId)
            return this.BadRequest("Informe um id");

        let user = (await this._userDatabase.QueryAsync(s => s.Id == userId)).FirstOrDefault();

        if (!user)
            return this.NotFound(`O usuario não existe`);

        user.Active = false;

        await this._userDatabase.UpdateAsync(user);

        return this.NoContent();
    }


}





