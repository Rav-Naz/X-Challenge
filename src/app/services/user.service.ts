import { AuthService } from 'src/app/services/auth.service';
import { UiService } from './ui.service';
import { TranslateService } from '@ngx-translate/core';
import { ErrorsService } from './errors.service';
import { HttpService } from './http.service';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  public userDetails: object | null = null;
  public user = new BehaviorSubject<object | null>(null);

  constructor(private http: HttpService, private errorService: ErrorsService, private ui: UiService, private translate: TranslateService,
    private websocket: WebsocketService, private injector: Injector) {
    this.websocket.getWebSocket$.subscribe((socket) => {
      socket?.on('users/editUser', (data) => {
        let currVal = this.user.value as any;
        if (currVal) {
          currVal.imie = data.imie;
          currVal.nazwisko = data.nazwisko;
          this.injector.get(AuthService).SetDetails(JSON.stringify(this.user.value))
        }
      })
    })
  }

  public getUser() {
    return new Promise<any>(async (resolve) => {
      const value = await this.http.getUser().catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      resolve(value);
    });
  }

  public editUser(imie: string, nazwisko: string) {
    return new Promise<any>(async (resolve) => {
      const value = await this.http.editUser(imie,nazwisko).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if (value) {
        this.ui.showFeedback("succes", this.translate.instant('competitor-zone.settings.errors.success-name'))
      }
      resolve(value);
    });
  }

  public  addUserPhoneNumber(numer_telefonu: string) {
    return new Promise<any>(async (resolve) => {
      const value = await this.http.addUserPhoneNumber(numer_telefonu).catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if (value) {
        this.ui.showFeedback("succes", this.translate.instant('competitor-zone.settings.errors.succesfuly-added-phone'), 5)
      }
      resolve(value);
    });
  }

  public confirmUserPhone(kod: string) {
    return new Promise<any>(async (resolve) => {
      const value = await this.http.confirmCode(this.userUUID,kod,'1').catch(err => {
        if(err.status === 400) {
          this.errorService.showError(err.status, this.translate.instant(err.error.body));
        } else {
          this.errorService.showError(err.status);
        }
      })
      if (value) {
        this.ui.showFeedback("succes", this.translate.instant('competitor-zone.settings.errors.succesfuly-confirmed'), 3)
      }
      resolve(value);
    });
  }

  get getUser$() {
    return this.user.asObservable();
  }

  get userType()
  {
    return this.userDetails ? (this.userDetails as any).uzytkownik_typ : null;
  }

  get userUUID()
  {
    return this.userDetails ? (this.userDetails as any).uzytkownik_uuid : null;
  }

  get isReferee() {
    return this.userType > 0;
  }

  get isAdmin() {
    return this.userType > 1;
  }
}
