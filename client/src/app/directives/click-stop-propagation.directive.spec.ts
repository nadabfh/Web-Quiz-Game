import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';
import { ClickStopPropagationDirective } from './click-stop-propagation.directive';

@Component({
    template: '<div appClickStopPropagation (click)="onClick()"></div>',
})
class TestComponent {
    onClick(): void {
        return;
    }
}

describe('ClickStopPropagationDirective', () => {
    let component: TestComponent;
    let fixture: ComponentFixture<TestComponent>;
    let directiveElement: DebugElement;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            declarations: [ClickStopPropagationDirective, TestComponent],
        }).compileComponents();
    });

    beforeEach(() => {
        fixture = TestBed.createComponent(TestComponent);
        component = fixture.componentInstance;
        directiveElement = fixture.debugElement.query(By.directive(ClickStopPropagationDirective));
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should stop event propagation on click', () => {
        const eventMock = new MouseEvent('click', { bubbles: true });
        const stopPropagationSpy = spyOn(eventMock, 'stopPropagation').and.callThrough();
        directiveElement.triggerEventHandler('click', eventMock);
        expect(stopPropagationSpy).toHaveBeenCalled();
    });

    it('should trigger onClick method', () => {
        const eventMock = new MouseEvent('click', { bubbles: true });
        const onClickSpy = spyOn(component, 'onClick').and.callThrough();
        directiveElement.triggerEventHandler('click', eventMock);
        expect(onClickSpy).toHaveBeenCalled();
    });
});
