
import { ControllerBase, GET, ActionResult } from "web_api_base";

export default class SampleController extends ControllerBase
{ 
        
    @GET()    
    public Ping() : ActionResult
    {       
        return this.OK({status : "pong"});
    }
        
}



