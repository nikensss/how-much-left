import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HowMuchLeftComponent } from './how-much-left.component';

describe('HowMuchLeftComponent', () => {
  let component: HowMuchLeftComponent;
  let fixture: ComponentFixture<HowMuchLeftComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HowMuchLeftComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HowMuchLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
