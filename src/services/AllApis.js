import {BASE_URL} from './BaseURL';
import {commonAPI} from './CommonRequest';

export const addUser = async(body,header)=>{
    return commonAPI("POST", `${BASE_URL}/add`,body,header)
}