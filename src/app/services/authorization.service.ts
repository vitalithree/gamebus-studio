import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { User } from '../models/gamebus/user.model';
import { AuthUser } from '../models/general/auth-user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthorizationService {

  authuser: AuthUser;

  isAuthenticatedSubject = new Subject<boolean>();
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    this.authuser = JSON.parse(localStorage.getItem('authuser'));

    this.observeIsAuthenticated(this.isAuthenticated());
  }


  public getAuthUser(): AuthUser {
    return this.authuser;
  }

  public getAccessToken(): string {
    if (!this.isAuthenticated()) { return null; }
    return this.authuser.token;
  }

  public parseAuthUser(object: any): AuthUser {
    this.authuser = new AuthUser(object.access_token, object.scope);
    localStorage.setItem('authuser', JSON.stringify(this.authuser));

    return this.authuser;
  }

  public setAuthUser(authuser: AuthUser) {
    this.authuser = authuser;
    localStorage.setItem('authuser', JSON.stringify(this.authuser));

    this.observeIsAuthenticated(true);
  }

  public setAuthUserDetails(user: User, roles: string[]): AuthUser {
    this.authuser.details = {
      uid: user.id,
      pid: user.player.id,
      roles,
      email: user.email,
      firstname: user.firstName,
      lastname: user.lastName,
      image: user.image,
      language: user.language
    };
    localStorage.setItem('authuser', JSON.stringify(this.authuser));
    return this.authuser;
  }

  public setAuthUserCampaign(chref: string): AuthUser {
    this.authuser.chref = chref;
    localStorage.setItem('authuser', JSON.stringify(this.authuser));
    return this.authuser;
  }


  public destroyAuthUser() {
    localStorage.removeItem('authuser');
    this.authuser = null;

    this.observeIsAuthenticated(false);
  }

  public isAuthenticated(): boolean {
    let isAuthenticated = false;
    if (this.authuser) { isAuthenticated = true; }
    return isAuthenticated;
  }

  public isAdmin(): boolean {
    return this.authuser.details.roles.includes('ADMIN');
  }



  observeIsAuthenticated(isAuthenticated: boolean) {
    this.isAuthenticatedSubject.next(isAuthenticated);
  }


}
