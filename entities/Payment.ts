import { FileService } from "web_api_base";
import Entity from "./Entity";


export default class Payment extends Entity {
    public Date: Date;
    public ImagePath: string;
    public UserId: string;

    constructor(userId: string, imagePath: string) {
        super();
        this.Date = new Date();
        this.ImagePath = imagePath;
        this.UserId = userId;
    }

    public async HasImageAsync(): Promise<boolean> {
        if (!this.ImagePath)
            return false;

        return await new FileService().FileExistsAsync(this.ImagePath);
    }
}
