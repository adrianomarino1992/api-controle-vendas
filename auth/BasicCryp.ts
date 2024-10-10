
const a = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 "{}:';
const b = 'qL5B8dN7vHkKpRxGw4Jt9cYO2MWDUjZeaAfnSEmT6gVFCluiXQ3by01zrsIPohÇ=()+';


export default class BasicCryp
{

    public static Encode(data : string)
    {
        let result = '';

        for(let c = 0; c < data.length; c++)
        {
            let inA = a.indexOf(data[c]);

            if(inA == -1)
                result += data[c];
            else
                result += b[inA];
        }

        return result;
    }

    public static Decode(hash : string)
    {
       let result = '';

        for(let c = 0; c < hash.length; c++)
        {
            let inB = b.indexOf(hash[c]);

            if(inB == -1)
                result += hash[c];
            else
                result += a[inB];
        }

        return result;
    }

}



