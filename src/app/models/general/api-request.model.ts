export class ApiRequest {
    uri: string;
    method: string;
    isAuthorized?: boolean;
    headers?: {
      key: string;
      value: any;
    }[];
    pathVariables?: {
      key: string;
      value: any;
    }[];
    requestParams?: {
      key: string;
      value: any;
    }[];
    requestBody?: any;
    response?: string;
  }
