import { UserService } from './user.service';
import { WebsocketService } from './websocket.service';
import { BehaviorSubject } from 'rxjs';
import { UiService } from './ui.service';
import { ErrorsService } from './errors.service';
import { Injectable } from '@angular/core';
import { HttpService } from './http.service';
import { Router } from '@angular/router';
import { sha256 } from 'js-sha256'
import { TranslateService } from '@ngx-translate/core';
import jwt_decode from 'jwt-decode';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  public JWT: string | null= null;
  public eventDate: Date | null = null;
  public accessToModifyExpirationDate: Date | null = null;
  public accessToModifySmashBotsExpirationDate: Date | null = null;
  public streamLink: SafeResourceUrl | undefined = undefined;
  private info = new BehaviorSubject<object | null>(null);

  constructor(private http: HttpService, private router: Router, private errorService: ErrorsService, private ui: UiService,
     private translate: TranslateService, private webSocket: WebsocketService, private userService: UserService,private sanitizer: DomSanitizer) {
    const details = localStorage.getItem('details');
    this.http.getHomePageInfo.subscribe((data) => {
      if(data === undefined || data === null) return;
      this.accessToModifyExpirationDate = new Date(data.body.accessToModifyExpirationDate);
      this.accessToModifySmashBotsExpirationDate = new Date(data.body.accessToSmashRobots);
      this.eventDate = new Date(data.body.eventDate);
      if(data.body.streamLink) {
        this.streamLink = this.sanitizer.bypassSecurityTrustResourceUrl(data.body.streamLink);
      }
      this.info.next({
        // eventDate: new Date(),
        eventDate: this.eventDate,
        accessToModifyExpirationDate: this.accessToModifyExpirationDate,
        accessToModifySmashBotsExpirationDate: this.accessToModifySmashBotsExpirationDate,
        streamLink: this.streamLink
      })
    })
    if (details) {
      this.SetDetails(details).then(() => {
        if(!this.isLogged) { this.SetDetails(null) }
        else {
          setTimeout(() => {
            this.userService.getUser().then((value) => {
              this.SetDetails(JSON.stringify({...value.body, token: this.JWT}))
            })
          }, 1000)
        };
      });
    } else {
      this.webSocket.createSocket();
    }
  }

  SetDetails(userDetails: string | null) {
    return new Promise<void>((resolve) => {
      
      if(userDetails !== null) {
        const detailsParsed = JSON.parse(userDetails);
        this.userService.userDetails = detailsParsed;
        this.JWT = detailsParsed.token;
        this.userService.user.next(detailsParsed);
        localStorage.setItem('details', JSON.stringify(detailsParsed));
        this.webSocket.createSocket(this.JWT!);
      } else {
        this.userService.user.next(null);
        this.userService.userDetails = null;
        this.JWT = null;
        localStorage.removeItem('details');
        this.webSocket.createSocket();
      }
      this.http.setNewToken(this.JWT);
      resolve();
    });
  }

  setUserPhoneLocaly(numer_telefonu: string | null) {
    (this.userService.userDetails as any).numer_telefonu = numer_telefonu;
    this.userService.user.next(this.userService.userDetails);
    localStorage.setItem('details', JSON.stringify(this.userService.userDetails));
  }

  async login(email: string, haslo: string)
  {
    return new Promise<string>(async (resolve) => {
      const value = await this.http.login(email,this.hashPassword(haslo).toString()).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));

        } else if (err.status === 401) {
          this.errorService.showError(err.status, this.translate.instant('competitor-zone.login.errors.failed'));
        }
         else {
          this.errorService.showError(err.status);
        }
      })
      if(value !== undefined) {
        this.SetDetails(JSON.stringify(value.body))
        this.router.navigateByUrl('/competitor-zone').then(() => {
        })
      }
      resolve(value);
    });
  }

  async register(imie: string, nazwisko: string, email: string, haslo: string) {
    return new Promise<string>(async (resolve) => {
      const value = await this.http.register(imie,nazwisko,email,this.hashPassword(haslo).toString()).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if(value !== undefined) {
        this.router.navigateByUrl('/login').then(() => {
          setTimeout(() => {
            this.ui.showFeedback("succes", this.translate.instant('competitor-zone.register.errors.success'), 4)
          }, 200)
        })
      }
      resolve(value);
    });
  }

  async remindPassword(email: string) {
    return new Promise<string>(async (resolve, reject) => {
      const value = await this.http.remindPassword(email).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if(value !== undefined) {
        this.ui.showFeedback("succes", this.translate.instant('competitor-zone.forgot-password.errors.sended'), 4)
        resolve(value);
      } else {
        reject();
      }
    });
  }

  async resetPassword(uzytkownik_uuid : string, kod: string, haslo: string) {
    return new Promise<string>(async (resolve) => {
      const value = await this.http.resetPassword(uzytkownik_uuid,kod,this.hashPassword(haslo).toString()).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if(value !== undefined) {
        this.router.navigateByUrl('/login').then(() => {
          setTimeout(() => {
            this.ui.showFeedback("succes", this.translate.instant('competitor-zone.reset-password.errors.success'), 4)
          }, 200)
        })
      }
      resolve(value);
    });
  }

  async changeUserPassword(stareHaslo : string, noweHaslo: string) {
    return new Promise<string>(async (resolve) => {
      const value = await this.http.changeUserPassword(this.hashPassword(stareHaslo).toString(), this.hashPassword(noweHaslo).toString()).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if(value !== undefined) {
        this.ui.showFeedback("succes", this.translate.instant('competitor-zone.settings.errors.success'))
      }
      resolve(value);
    });
  }

  async logout()
  {
    return new Promise<void>(async (resolve) => {
      await this.SetDetails(null);
      if(this.router.url.length === 1 || (this.router.url.length > 1 && this.router.url.slice(0,2) === '/#')) { //jeśli jest na stronie głownej
        setTimeout(() => {
          this.ui.showFeedback('succes', this.translate.instant('competitor-zone.login.errors.logout'), 3);
        }, 400);
      } else {
        this.router.navigateByUrl('/login').then(() => {
          setTimeout(() => {
            this.ui.showFeedback('succes', this.translate.instant('competitor-zone.login.errors.logout'), 3);
          }, 400);
        });
      }
      resolve()
    });
  }

  hashPassword(haslo: string): string {
    return sha256(haslo);
  }

  get info$() {
    return this.info.asObservable();
  }

  get isLogged()
  {
    if(this.JWT === null || this.JWT === undefined) return false;
    const d = new Date(0);
    d.setUTCSeconds((jwt_decode(this.JWT!) as any).exp);
    return new Date() < d;
  }

  get canModify() {
    // return false
    return (this.accessToModifyExpirationDate !== null && this.accessToModifyExpirationDate > new Date()) || this.userService.isReferee;
  }

  get canModifySmash() {
    // return false
    return (this.accessToModifySmashBotsExpirationDate !== null && this.accessToModifySmashBotsExpirationDate > new Date()) || this.userService.isReferee;
  }

}
