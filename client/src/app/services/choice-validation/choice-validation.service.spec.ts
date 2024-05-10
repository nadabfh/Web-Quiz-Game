import { HttpResponse } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ChoiceValidationService } from './choice-validation.service';

const mockHttpResponse: HttpResponse<string> = new HttpResponse({ status: 200, statusText: 'OK', body: JSON.stringify(true) });

describe('ChoiceValidationService', () => {
    let choiceValidationService: ChoiceValidationService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [ChoiceValidationService],
        });
        choiceValidationService = TestBed.inject(ChoiceValidationService);
    });

    it('should be created', () => {
        expect(choiceValidationService).toBeTruthy();
    });

    it('should validate choices successfully', () => {
        const choices = { selected: ['yes', 'no'] };
        const spy = spyOn(choiceValidationService, 'add').and.returnValue(of(mockHttpResponse));
        choiceValidationService.validateChoices(choices, '0', '007');
        expect(spy).toHaveBeenCalledWith(choices, '0/questions/007/validate-choice');
    });
});
