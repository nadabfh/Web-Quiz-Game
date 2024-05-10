import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PulseLoaderComponent } from './pulse-loader.component';

describe('PulseLoaderComponent', () => {
    let component: PulseLoaderComponent;
    let fixture: ComponentFixture<PulseLoaderComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [PulseLoaderComponent],
        });
        fixture = TestBed.createComponent(PulseLoaderComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
