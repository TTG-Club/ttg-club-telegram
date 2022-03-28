import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../.config';

export default class HTTPService {
    private readonly axios: AxiosInstance = axios.create({
        baseURL: `${config.baseURL}/api/v1`
    });

    public async post(url: string, options: any) {
        try {
            const resp = await this.axios.post(url, options);

            return this.parseResponse(resp);
        } catch (err) {
            console.log(err);
        }
    }

    private parseResponse = (response: AxiosResponse) => response.data
}
