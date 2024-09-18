import MD5 from 'md5';

export default abstract class Entity
{
    public Id: string;

    constructor()
    {
        this.Id = MD5(`${this.constructor.name}${new Date().getMilliseconds()}`);
    }

    public CreateId() : string
    {
        this.Id = MD5(`${this.constructor.name}${new Date().getMilliseconds()}`);
        return this.Id;
    }
}