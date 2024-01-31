import axios from 'axios';

export const commonAPI = async(method,url,body,header)=>{
    let config ={
        method,
        url,
        data:body,
        headers:header?header:{ "content-Type":"application/json"}
        
    }
    return axios(config).then(
        (response)=>{
            return response
        }
    ).catch((err)=>{
        return err
    })

}
