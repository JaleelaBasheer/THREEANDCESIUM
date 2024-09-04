import {BASE_URL} from './BaseURL';
import {commonAPI} from './CommonRequest';

export const addUser = async(body,header)=>{
    return commonAPI("POST", `${BASE_URL}/add`,body,header)
}

export const getAllOffset = async()=>{
    return commonAPI("GET", `${BASE_URL}/getasset`)
}

// create asset
export const createAsset = async(body)=>{
    return commonAPI("POST", `${BASE_URL}/createasset`,body)
}

// Get all mesh table
export const getALl = async()=>{
    return commonAPI("GET", `${BASE_URL}/getall`)
}

// Get all object table
export const getallobject = async()=>{
    return commonAPI("GET", `${BASE_URL}/getallobject`)
}

// Get all fbx files from table
export const getallfbxfiles = async()=>{
    return commonAPI("GET", `${BASE_URL}/getallfbxfiles`)
}

// add comment
export const addComment = async(body,header)=>{
    return commonAPI("POST", `${BASE_URL}/addcomment`,body,header)
}

// get all comments
export const getAllComment = async()=>{
    return commonAPI("GET", `${BASE_URL}/getcomment`)
}

