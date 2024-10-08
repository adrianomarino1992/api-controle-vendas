
import { Application, IApplicationConfiguration } from "web_api_base";
import Datababase from "./database/Database";
import Entity from "./entities/Entity";


export default class App extends Application
{
    constructor()
    {
        super();
    }
        
    public override async ConfigureAsync(appConfig: IApplicationConfiguration): Promise<void>
    {  
        
        this.UseCors();     

        appConfig.Host = '192.168.15.144';
            
        await this.UseControllersAsync();

        appConfig.AddGenericScoped(Datababase, undefined, undefined, t => 
        {
            return new Datababase(t as new(...args: any[]) => Entity);
        });

        if(appConfig.DEBUG)
            this.CreateDocumentation();

    }        

        
}