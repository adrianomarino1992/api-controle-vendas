import FileService from 'web_api_base/dist/file/FileService';
import Path from 'path';
import { Application } from 'web_api_base';
import Entity from '../entities/Entity';

export default class Datababase<T extends Entity>
{
    private _cTor : new(...args: any[]) => T;
    private _dbPath : string;
    private _dbFolder : string;
    private _imgFolder : string;
    private _dbArchivedFolder : string;
    private _dbFile : string;
    private _fileSystem : FileService;
    private _started : boolean;

    constructor(cTor: new(...args: any[]) => T)
    {
        this._cTor = cTor;
        this._dbPath = Path.join(Application.Configurations.RootPath, "database");
        this._dbFolder = Path.join(this._dbPath, this._cTor.name.toLowerCase());
        this._imgFolder = Path.join(this._dbPath, "images", this._cTor.name.toLowerCase());
        this._dbArchivedFolder = Path.join(this._dbPath, this._cTor.name.toLowerCase(), "archiveds");

        this._dbFile = Path.join(this._dbFolder, "current.db");        
        this._fileSystem = new FileService();
        this._started = false;
    }

    private async EnsureStartAsync()
    {
        if(!this._started)
            await this.InitAsync();
    }

    public async InitAsync()
    {  
        if(!(await this._fileSystem.DirectoryExistsAsync(this._dbPath)))
            await this._fileSystem.CreateDirectoryAsync(this._dbPath);

        if(!(await this._fileSystem.DirectoryExistsAsync(this._dbFolder)))
            await this._fileSystem.CreateDirectoryAsync(this._dbFolder);

        if(!(await this._fileSystem.DirectoryExistsAsync(this._dbArchivedFolder)))
            await this._fileSystem.CreateDirectoryAsync(this._dbArchivedFolder);

        if(!(await this._fileSystem.DirectoryExistsAsync(this._imgFolder)))
            await this._fileSystem.CreateDirectoryAsync(this._imgFolder);

        this._started = true;

    }

    public async SaveAsync(list: T[]) : Promise<void>
    {
       await this.EnsureStartAsync();

       await this._fileSystem.WriteAllTextAsync(this._dbFile, JSON.stringify(list), 'utf-8');
    }

    public async ReadAsync() : Promise<T[]>
    {
       await this.EnsureStartAsync();        

       if(!await this._fileSystem.FileExistsAsync(this._dbFile))
        return [];

       let data = await this._fileSystem.ReadAllTextAsync(this._dbFile, 'utf-8');

       return this.Cast(data);
      
    }        

    public async ArchiveAsync(list: T[]) : Promise<void>
    {
       await this.EnsureStartAsync();

       let date = new Date();

       let archive = `${date.getUTCFullYear()}_${date.getUTCMonth()}_${date.getUTCDate()}_archive.db`;

       await this._fileSystem.WriteAllTextAsync(archive, JSON.stringify(list), 'utf-8');
    }

    public async ReadArchivedsAsync(predicate : (date: Date) => boolean) : Promise<T[]>
    {
       await this.EnsureStartAsync();

       let files = await this._fileSystem.GetAllFilesAsync(this._dbArchivedFolder);

       let itens: T[] = [];

       for(let file of files)
       {
            let dateArchiving = this.GetDateOfArchiving(file);
            
            if(predicate(dateArchiving))
                itens.AddRange(this.Cast(await this._fileSystem.ReadAllTextAsync(file, 'utf-8')));
       }

       return itens;   
      
    }

    public async SaveImageAsync(filePath : string) : Promise<string>
    {
        let pathInfo = Path.parse(filePath);

        let filesInFolder = await this._fileSystem.GetAllFilesAsync(this._imgFolder);

        let newName = Path.join(this._imgFolder, `img_${filesInFolder.Count()}${pathInfo.ext}`);

        await this._fileSystem.CopyAsync(filePath, newName);

        await this._fileSystem.DeleteAsync(filePath);    
        
        return newName;
    }

    public async CheckImageAsync(path : string) : Promise<boolean>
    {
        return await this._fileSystem.FileExistsAsync(path);
    }

    public async DeleteImageAsync(filePath : string) : Promise<void>
    {
        if(!await this._fileSystem.FileExistsAsync(filePath))
            return;

        await this._fileSystem.DeleteAsync(filePath);        
    }

    public async AddAsync(obj: T): Promise<void> 
    {
        let list = await this.ReadAsync();
        if(!obj.Id)
            obj.CreateId();
        list.RemoveAll(s => s.Id == obj.Id); 
        list.Add(obj);
        await this.SaveAsync(list);
    }

    public async UpdateAsync(obj: T): Promise<void> 
    {
        await this.AddAsync(obj);
    }

    public async DeleteAsync(obj: T): Promise<void> 
    {
        let list = await this.ReadAsync();
        list.RemoveAll(s => s.Id == obj.Id);        
        await this.SaveAsync(list);
    }

    public async QueryAsync(predicate: (o: T) => boolean): Promise<T[]> 
    {
        return (await this.ReadAsync()).Where(predicate);
    }

    private GetDateOfArchiving(filePath : string)
    {
        let parts = filePath.split('_');

        return new Date(Date.UTC(Number.parseInt(parts[0]), Number.parseInt(parts[1]), Number.parseInt(parts[2])));
    }

    private Cast(json: string): T[]
    {
        if(!json)
            return [];
    
           let rows = JSON.parse(json) as Array<any>;
    
           rows.forEach(r => 
            {
                r.__proto__ = this._cTor.prototype;
            });
    
            return rows.Select(s => s as T);
    } 



}

