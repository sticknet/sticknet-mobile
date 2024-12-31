import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';
import camelize from '../utils/camelize';
import snakeize from '../utils/snakeize';

const myaxios = {
    get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        const response = await axios.get(url, config);
        response.data = camelize(response.data);
        return response;
    },
    post: async <T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        const response = await axios.post(url, snakeize(body), config);
        response.data = camelize(response.data);
        return response;
    },
    patch: async <T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        const response = await axios.patch(url, snakeize(body), config);
        response.data = camelize(response.data);
        return response;
    },
    delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        const response = await axios.delete(url, config);
        response.data = camelize(response.data);
        return response;
    },
    put: async <T = any>(url: string, body?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
        return axios.put(url, body, config);
    },
};

export default myaxios;
