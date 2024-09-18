import Type from 'web_api_base/dist/metadata/Type';
import CreateOrderDTO, { CreateOrderItemDTO } from './order/CreateOrderDTO';

export default class CreateTemplate 
{

    public static CreateTemplate(cTor: new (...args: any[]) => any) : string
    {
        if(cTor == CreateOrderDTO)
            return this.CreateOrderDTOTemplate();        
       
        return JSON.stringify(Type.CreateTemplateFrom(cTor), null, 2);
    } 

    public static CreateOrderDTOTemplate() : string
    {        
        let template = new CreateOrderDTO("", [Type.CreateTemplateFrom(CreateOrderItemDTO)]);
        return JSON.stringify(template, null, 2);
    }

}