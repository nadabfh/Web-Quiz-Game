/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HistogramService } from '@app/services/histogram/histogram.service';
import { AgChartsAngularModule } from 'ag-charts-angular';
import { HistogramComponent } from './histogram.component';
import { Subject, Subscription } from 'rxjs';
import { Histogram, MultipleChoiceHistogram } from '@common/interfaces/histogram';
import { ChoiceTally } from '@common/interfaces/choice-tally';

describe('HistogramComponent', () => {
    let component: HistogramComponent;
    let fixture: ComponentFixture<HistogramComponent>;
    let histogramServiceSpy: jasmine.SpyObj<HistogramService>;
    let histogramSubject: Subject<Histogram>;

    beforeEach(() => {
        histogramServiceSpy = jasmine.createSpyObj('HistogramService', ['onCurrentHistogram']);
        TestBed.configureTestingModule({
            declarations: [HistogramComponent],
            imports: [AgChartsAngularModule],
            providers: [{ provide: HistogramService, useValue: histogramServiceSpy }],
        });

        fixture = TestBed.createComponent(HistogramComponent);
        component = fixture.componentInstance;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any

        histogramSubject = new Subject<Histogram>();
        histogramServiceSpy.currentHistogram$ = histogramSubject.asObservable();

        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('subscribeToCurrentHistogram() should add a subscription to currentHistogram and respond when histogram changes ', () => {
        const mockHistogram: MultipleChoiceHistogram = {
            type: 'QCM',
            question: 'question',
            choiceTallies: [{} as ChoiceTally],
        };
        const setUpDataSpy = spyOn(component, 'setUpData');
        const setupChartSpy = spyOn<any>(component, 'setupChart').and.callFake(() => {});
        const subscriptions: Subscription[] = (component['histogramSubscriptions'] = []);
        component['subscribeToCurrentHistogram']();
        expect(subscriptions.length).toEqual(1);
        histogramSubject.next(mockHistogram);
        expect(component.currentQuestion).toEqual(mockHistogram.question);
        expect(component.choiceTally).toEqual(mockHistogram.choiceTallies);
        expect(setUpDataSpy).toHaveBeenCalled();
        expect(setupChartSpy).toHaveBeenCalled();
    });

    it('should initalize correctly if it is in results page', () => {
        component.isResultsPage = true;
        component.currentHistogram = {
            question: 'question',
            type: 'QCM',
            choiceTallies: [],
        };
        component.ngOnInit();
        expect(component.choiceTally).toEqual(component.currentHistogram.choiceTallies);
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
                    choiceTallies: [],
                },
                previousValue: {
                    question: 'old question',
                    choiceTallies: [],
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
        expect(component.choiceTally).toEqual([]);
    });

    it('should set up data', () => {
        component.choiceTally = [
            {
                text: 'text',
                isCorrect: true,
                tally: 1,
            },
            {
                text: 'text',
                isCorrect: false,
                tally: 1,
            },
        ];
        const data = component.setUpData();
        expect(data).toEqual([
            {
                label: 'C1 ✅',
                text: 'text',
                picks: 1,
            },
            {
                label: 'C2 ❌',
                text: 'text',
                picks: 1,
            },
        ]);
    });

    it('should render chart', () => {
        const params = {
            datum: {
                text: 'text',
                picks: 1,
            },
        };
        const content = component.renderChart(params);
        expect(content).toEqual({
            content: 'Choix: text <br/> Sélections: 1',
        });
    });

    it('should format chart', () => {
        const params = {
            datum: {
                label: 'C1 ✅',
            },
            xKey: 'label',
        };
        const fill = component.formatChart(params);
        expect(fill).toEqual({ fill: 'green' });
    });

    it('should format chart', () => {
        const params = {
            datum: {
                label: 'C2 ❌',
            },
            xKey: 'label',
        };
        const fill = component.formatChart(params);
        expect(fill).toEqual({ fill: 'red' });
    });

    it('should set up chart options correctly', () => {
        const data = [
            {
                label: 'C1 ✅',
                text: 'text',
                picks: 1,
            },
            {
                label: 'C2 ❌',
                text: 'text',
                picks: 1,
            },
        ];
        component.currentQuestion = 'Question';
        component['setupChart'](data);

        expect(component.chartOptions).toEqual({
            title: { text: 'Question' },
            axes: [
                {
                    type: 'category',
                    position: 'bottom',
                    title: { text: 'Choix de réponse' },
                },
                {
                    type: 'number',
                    position: 'left',
                    title: { text: 'Nombre de sélections' },
                },
            ],
            data,
            series: [
                {
                    type: 'bar',
                    xKey: 'label',
                    xName: 'Choix de réponse',
                    yKey: 'picks',
                    yName: 'Nombre de choix',
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
