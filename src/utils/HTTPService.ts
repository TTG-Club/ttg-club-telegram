import axios, { AxiosInstance, AxiosResponse } from 'axios';
import config from '../.config';

export default class HTTPService {
    private readonly axios: AxiosInstance = axios.create({
        baseURL: `${config.baseURL}/api/fvtt/v1`
    });

    public async get(url: string, params: any) {
        try {
            const resp = await this.axios(
                {
                    url,
                    params: new URLSearchParams(params),
                    method: 'get',
                }
            );

            return this.parseResponse(resp);
        } catch (err) {
            console.error(err);
        }
    }

    private parseResponse = (response: AxiosResponse) => response.data
}
