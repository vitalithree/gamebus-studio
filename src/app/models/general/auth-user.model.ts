export class AuthUser {

    token: string;
    scope: string;
    chref: string;
    details: {
        uid: number;
        pid: number;
        roles: string[];
        email: string;
        firstname: string;
        lastname: string;
        image: string;
        language: string;
    };

    constructor(token: string, scope: string) {
        this.token = token;
        this.scope = scope;
    }
}
