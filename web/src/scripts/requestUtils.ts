import axios, {AxiosInstance} from "axios";
import {Config} from "@web/config";

let _request: AxiosInstance;

export function initializeAxios(): AxiosInstance{
    let domain = Config.apiDomain;
    let baseURL = `${domain}`;
    axios.defaults.baseURL = baseURL;
    console.log("set axios base url to ", baseURL);


    _request = axios.create({
        baseURL: Config.apiDomain
    });

    return _request

}


function getInstance(){
    if (_request){
        return _request;
    }

    return initializeAxios();
}

export const request = getInstance();