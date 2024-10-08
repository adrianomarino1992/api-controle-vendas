import { CreateMetada } from "web_api_base";
import CreateOrderDTO, { CreateOrderItemDTO } from "./CreateOrderDTO";



export default class UpdateOrderDTO extends CreateOrderDTO {
    
    public Id: string;

    constructor(id: string, userId: string, itens: CreateOrderItemDTO[]) 
    {
        super(userId, itens);
        this.Id = id;
    }

    public IsValid(): string[] {
        let validationResult: string[] = [];

        if (!this.Id)
            validationResult.Add(`O id do pedido é obrigatorio`);

        validationResult.AddRange(super.IsValid());

        return validationResult;
    }

}
