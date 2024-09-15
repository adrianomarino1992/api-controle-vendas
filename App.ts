
import { Application, IApplicationConfiguration } from "web_api_base";


export default class App extends Application
{
    constructor()
    {
        super();
    }
        
    public override async ConfigureAsync(appConfig: IApplicationConfiguration): Promise<void>
    {  
        
        this.UseCors();     
            
        await this.UseControllersAsync();

        if(appConfig.DEBUG)
            this.CreateDocumentation();

    }        

        
}