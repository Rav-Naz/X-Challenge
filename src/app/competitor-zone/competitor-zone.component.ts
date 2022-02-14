import { RefereeService } from 'src/app/services/referee.service';
import { AuthService } from './../services/auth.service';
import { Router } from '@angular/router';
import { UserService } from './../services/user.service';
import { Component, ViewEncapsulation, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { RobotsService } from '../services/robots.service';
import { ConstructorsService } from '../services/constructors.service';
import { PositionsService } from '../services/positions.service';
import { WindowSize } from '../models/window_size.model';
import { fromEvent, Observable, Subscription } from 'rxjs';

@Component({
  selector: 'app-competitor-zone',
  templateUrl: './competitor-zone.component.html',
  styleUrls: ['./competitor-zone.component.scss'],
  encapsulation: ViewEncapsulation.None,
  providers: [RobotsService, ConstructorsService, PositionsService, RefereeService]
})
export class CompetitorZoneComponent implements OnDestroy{

  public timeLeft: number | undefined;
  public timeLeftSmashBots: number | undefined;
  public timeIsUp: boolean = false;
  public timeIsUpSmashBots: boolean = false;
  public switcher = false;
  public windowSize: WindowSize = { height: 1080, width: 1920};
  private subs: Subscription = new Subscription;



  constructor(public translate: TranslateService, public userService: UserService, private router: Router,
    public constructorService: ConstructorsService, public authService: AuthService, public positionsService: PositionsService) {
      setInterval(() => {
        this.switcher = !this.switcher;
      }, 5000)
      this.refreshCounter();
    setInterval(() => {
      this.refreshCounter();
    }, 1000);
    this.windowSize = {height: window.innerHeight, width: window.innerWidth };
    const resizeObs = fromEvent(window, 'resize') as Observable<any>;
    const sub1 = resizeObs.subscribe(size => {
      if (!size) { return; }
      this.windowSize = {height: size.currentTarget.innerHeight, width: size.currentTarget.innerWidth};
    })
    this.subs?.add(sub1);

  }

  refreshCounter() :void {
    if(!this.authService.accessToModifyExpirationDate || !this.authService.accessToModifySmashBotsExpirationDate) return;
    this.timeLeft = this.authService.accessToModifyExpirationDate.getTime() - new Date().getTime();
    this.timeLeftSmashBots = this.authService.accessToModifySmashBotsExpirationDate.getTime() - new Date().getTime();
    if(Math.floor(this.timeLeft/1000) < 0) {
      this.timeIsUp = true;
    }
    if(Math.floor(this.timeLeftSmashBots/1000) < 0) {
      this.timeIsUpSmashBots = true;
    }
  }
  
  openTutorial() {
    if (this.translate.currentLang == "pl") {
      window.open('https://rzit.smarthost.pl/robomotion/tutorial.pdf');
    } else {
      window.open('https://rzit.smarthost.pl/robomotion/tutorial-ang.pdf');
    }
  }

  get isLessThanWeek() {
    return this.timeLeft && Math.floor(this.timeLeft/1000) < 604800;
  }

  get isLessThanWeekSmashBots() {
    return this.timeLeftSmashBots && Math.floor(this.timeLeftSmashBots/1000) < 604800;
  }

  get isFirstPage() {
    return this.router.url === '/competitor-zone';
  }

  get isMobile() {
    return this.windowSize.width < 800;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
