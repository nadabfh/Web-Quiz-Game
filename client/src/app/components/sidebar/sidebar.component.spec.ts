import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SidebarComponent } from '@app/components/sidebar/sidebar.component';

@Component({
    // Angular Material Mock: Provided selector does not start by app
    // eslint-disable-next-line @angular-eslint/component-selector
    selector: 'mat-select',
    template: '',
})
class MockMatSelectComponent {}

describe('SidebarComponent', () => {
    let component: SidebarComponent;
    let fixture: ComponentFixture<SidebarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [SidebarComponent, MockMatSelectComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(SidebarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
