/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { Histogram, PlayerCountHistogram } from '@common/interfaces/histogram';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { Subject, Subscription } from 'rxjs';
import { LongAnswerHistogramComponent } from './long-answer-histogram.component';

describe('LongAnswerHistogramComponent', () => {
    let component: LongAnswerHistogramComponent;
    let fixture: ComponentFixture<LongAnswerHistogramComponent>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let histogramSubject: Subject<Histogram>;

    beforeEach(() => {
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['onCurrentHistogram']);
        TestBed.configureTestingModule({
            declarations: [LongAnswerHistogramComponent],
            imports: [AgChartsAngularModule],
            providers: [{ provide: HistogramService, useValue: histogramServiceSpy }],
        });
        fixture = TestBed.createComponent(LongAnswerHistogramComponent);
        component = fixture.componentInstance;
        histogramSubject = new Subject<Histogram>();
        histogramServiceSpy.currentHistogram$ = histogramSubject.asObservable();

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('subscribeToCurrentHistogram() should add a subscription to currentHistogram and respond when histogram changes ', () => {
        const mockHistogram: PlayerCountHistogram = {
            type: 'QRL',
            question: 'question',
            playerCount: 2,
            activePlayers: 1,
            inactivePlayers: 1,
        };
        const setUpDataSpy = spyOn(component, 'setUpData');
        const setupChartSpy = spyOn<any>(component, 'setupChart').and.callFake(() => {});
        const subscriptions: Subscription[] = (component['histogramSubscriptions'] = []);
        component['subscribeToCurrentHistogram']();
        expect(subscriptions.length).toEqual(1);
        histogramSubject.next(mockHistogram);
        expect(component.currentQuestion).toEqual(mockHistogram.question);
        expect(component.activePlayers).toEqual(mockHistogram.activePlayers);
        expect(component.inactivePlayers).toEqual(mockHistogram.inactivePlayers);
        expect(setUpDataSpy).toHaveBeenCalled();
        expect(setupChartSpy).toHaveBeenCalled();
    });

    it('should initalize correctly if it is in results page', () => {
        component.isResultsPage = true;
        component.currentLongAnswerHistogram = {
            question: 'question',
            type: 'QCM',
            gradeTallies: [],
        };
        component.ngOnInit();
        expect(component.gradeTally).toEqual(component.currentLongAnswerHistogram.gradeTallies);
    });

    it('should reset chart and initialize on changes if currentQuestion changes', () => {
        const changes = {
            currentQuestion: {
                currentValue: 'new question',
                previousValue: 'old question',
                firstChange: true,
                isFirstChange: () => true,
            },
        };
        spyOn(component, 'resetChart');
        spyOn(component, 'ngOnInit');

        component.ngOnChanges(changes);

        expect(component.resetChart).toHaveBeenCalled();
        expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should reset chart and initialize on changes if currentHistogram changes', () => {
        const changes = {
            currentHistogram: {
                currentValue: {
                    question: 'new question',
                    type: 'QCM',
                    gradeTallies: [],
                },
                previousValue: {
                    question: 'old question',
                    type: 'QCM',
                    gradeTallies: [],
                },
                firstChange: true,
                isFirstChange: () => true,
            },
        };
        spyOn(component, 'resetChart');
        spyOn(component, 'ngOnInit');

        component.ngOnChanges(changes);

        expect(component.resetChart).toHaveBeenCalled();
        expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should reset chart and initialize on changes if currentHistogram changes', () => {
        const changes = {
            currentLongAnswerHistogram: {
                currentValue: {
                    question: 'new question',
                    type: 'QRL',
                    gradeTallies: [],
                },
                previousValue: {
                    question: 'old question',
                    type: 'QRL',
                    gradeTallies: [],
                },
                firstChange: true,
                isFirstChange: () => true,
            },
        };
        spyOn(component, 'resetChart');
        spyOn(component, 'ngOnInit');

        component.ngOnChanges(changes);

        expect(component.resetChart).toHaveBeenCalled();
        expect(component.ngOnInit).toHaveBeenCalled();
    });

    it('should unsubscribe from subscriptions on ngOnDestroy', () => {
        const unsubscribeSpy = jasmine.createSpyObj('unsubscribe', ['unsubscribe']);
        const subscriptions = [unsubscribeSpy, unsubscribeSpy, unsubscribeSpy];
        component['histogramSubscriptions'] = subscriptions;

        component.ngOnDestroy();

        expect(unsubscribeSpy.unsubscribe).toHaveBeenCalledTimes(subscriptions.length);
    });

    it('should reset chart', () => {
        component.resetChart();
        expect(component.chartOptions).toEqual({});
        expect(component.gradeTally).toEqual([]);
    });

    it('should set up data correctly', () => {
        const data = component.setUpData();
        expect(data).toEqual([
            {
                grade: 'Actif',
                count: component.activePlayers,
            },
            {
                grade: 'Inactif',
                count: component.inactivePlayers,
            },
        ]);
    });

    it('should set up data correctly for results page', () => {
        component.gradeTally = [
            {
                score: 'A',
                tally: 1,
            },
            {
                score: 'B',
                tally: 2,
            },
        ];
        const data = component.setUpResultsPageData();
        expect(data).toEqual([
            {
                grade: 'A',
                count: 1,
            },
            {
                grade: 'B',
                count: 2,
            },
        ]);
    });

    it('should render chart', () => {
        const params = {
            datum: {
                grade: 'Actif',
                count: 1,
            },
        };
        const result = component['renderChart'](params);
        expect(result).toEqual({ content: `Note: ${params.datum.grade}\nNombre: ${params.datum.count}` });
    });

    it('should format chart', () => {
        const params = {
            datum: {
                grade: '0',
            },
        };
        const result = component['formatChart'](params);
        expect(result).toEqual({ fill: '#8e95ca' });
    });

    it('should format chart', () => {
        const params = {
            datum: {
                grade: '50',
            },
        };
        const result = component['formatChart'](params);
        expect(result).toEqual({ fill: '#6d75bb' });
    });

    it('should format chart', () => {
        const params = {
            datum: {
                grade: '100',
            },
        };
        const result = component['formatChart'](params);
        expect(result).toEqual({ fill: '#4a56ae' });
    });

    it('should setup chart', () => {
        const data = [
            {
                grade: 'Actif',
                count: 1,
            },
            {
                grade: 'Inactif',
                count: 1,
            },
        ];
        component['setupChart'](data);
        expect(component.chartOptions).toEqual({
            title: { text: component.currentQuestion },
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                },
                {
                    type: 'number',
                    position: 'left',
                    title: { text: 'Nombre de joueurs' },
                },
            ],
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'grade',
                    yKey: 'count',
                    yName: 'Nombre de joueurs',
                },
            ],
        });
    });

    it('should setup results page chart', () => {
        const data = [
            {
                grade: '0',
                count: 1,
            },
            {
                grade: '50',
                count: 2,
            },
            {
                grade: '100',
                count: 3,
            },
        ];
        component['setupResultsPageChart'](data);
        expect(component.chartOptions).toEqual({
            title: { text: component.currentQuestion },
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    title: { text: 'Note sur 100' },
                },
                {
                    type: 'number',
                    position: 'left',
                    title: { text: 'Nombre de joueurs' },
                },
            ],
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'grade',
                    xName: 'Note sur 100',
                    yKey: 'count',
                    yName: 'Nombre de joueurs',
                    tooltip: {
                        enabled: true,
                        renderer: jasmine.any(Function),
                    },
                    formatter: jasmine.any(Function),
                },
            ],
        });
    });
});
