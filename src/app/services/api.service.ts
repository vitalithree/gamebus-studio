import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { ApiRequest } from '../models/general/api-request.model';
import { AuthorizationService } from './authorization.service';
import { throwError } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class ApiService {

  uris = environment.uris;
  client = environment.client;

  constructor(
    private http: HttpClient,
    private as: AuthorizationService,
  ) {
  }

  public promise(request: ApiRequest): Promise<any | any[]> {
    return new Promise(
      (resolve, reject) => {
        this.request(request).subscribe(
          (result: any | any[]) => {
            resolve(result);
          },
          (error: any) => {
            reject(error);
          }
        );
      }
    );
  }


  public request(request: ApiRequest): any | any[] {
    // Set request path and path variables
    let path = request.uri.match(/^(http(s?)):\/\//gi) ? request.uri : this.uris.api + request.uri;
    if (request.pathVariables != null) {
      for (const pathVariable of request.pathVariables) {
        path = path.replace('{' + pathVariable.key + '}', pathVariable.value);
      }
    }

    // Set request- / query parameters
    let requestParams = new HttpParams();
    if (request.requestParams != null) {
      for (const requestParam of request.requestParams) {
        requestParams = requestParams.append(requestParam.key, requestParam.value);
      }
    }

    // Set headers and authentication parameters
    let requestHeaders = new HttpHeaders();
    if (request.isAuthorized == null) { request.isAuthorized = true; }
    if (request.isAuthorized) {
      if (this.as.isAuthenticated()) {
        requestHeaders = requestHeaders.append('Authorization', 'Bearer ' + this.as.getAccessToken());
      } else {
        throw throwError(() => new Error('NOT AUTHENTICATED'));
      }
    }
    if (request.headers != null) {
      for (const header of request.headers) {
        requestHeaders = requestHeaders.append(header.key, header.value);
      }
    }

    // Configure API request
    const requestOptions: any = {
      responseType: 'json',
      params: requestParams,
      headers: requestHeaders,
      // withCredentials: request.isAuthorized,
      reportProgress: false,
    };

    // Set request body (if available)
    if (request.requestBody) {
      requestOptions.body = request.requestBody;
    }

    return this.http.request(request.method.toUpperCase(), path, requestOptions);
  }


  public getAsset(asset: string): Promise<string> {
    return new Promise((resolve) => {
      this.http.get(`${this.uris.self}${asset}`, { responseType: 'text' }).subscribe(
        html => resolve(html));
    });
  }



}


