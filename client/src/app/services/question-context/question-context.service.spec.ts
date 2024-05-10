import { TestBed } from '@angular/core/testing';

import { MatchContext } from '@app/constants/states';
import { MatchContextService } from './question-context.service';

describe('QuestionContextService', () => {
    let service: MatchContextService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(MatchContextService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should set context', () => {
        service.setContext(MatchContext.TestPage);
        expect(service['context']).toBe(MatchContext.TestPage);
    });

    it('should get context', () => {
        service.setContext(MatchContext.TestPage);
        const context = service.getContext();
        expect(context).toBe(MatchContext.TestPage);
    });

    it('should reset context', () => {
        service.setContext(MatchContext.TestPage);
        service.resetContext();
        expect(service['context']).toBe(MatchContext.Null);
    });
});
