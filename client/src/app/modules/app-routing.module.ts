import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { QuestionAreaComponent } from '@app/components/question-area/question-area.component';
import { ManagementState } from '@app/constants/states';
import { adminLoginGuard } from '@app/guards/admin-login/admin-login.guard';
import { matchLoginGuard } from '@app/guards/match-login/match-login.guard';
import { returnGuard } from '@app/guards/return-guard/return.guard';
import { AdminPageComponent } from '@app/pages/admin-page/admin-main-page/admin-page.component';
import { AdminQuestionBankComponent } from '@app/pages/admin-page/admin-question-bank/admin-question-bank.component';
import { AdminQuestionsListComponent } from '@app/pages/admin-page/admin-questions-list/admin-questions-list.component';
import { HomePageComponent } from '@app/pages/home-page/home-page.component';
import { MatchCreationPageComponent } from '@app/pages/match-creation-page/match-creation-page.component';
import { ResultsPageComponent } from '@app/pages/results-page/results-page.component';
import { WaitPageComponent } from '@app/pages/wait-page/wait-page.component';

const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomePageComponent },
    {
        path: 'admin',
        canActivate: [adminLoginGuard],
        children: [
            { path: 'bank', component: AdminQuestionBankComponent },
            { path: 'games', component: AdminPageComponent },
            {
                path: 'games/new',
                component: AdminQuestionsListComponent,
                data: { state: ManagementState.GameCreate },
                canDeactivate: [returnGuard],
            },
            {
                path: 'games/:id',
                component: AdminQuestionsListComponent,
                data: { state: ManagementState.GameModify },
                canDeactivate: [returnGuard],
            },
        ],
    },
    { path: 'host', component: MatchCreationPageComponent },
    { path: 'match-room', canActivate: [matchLoginGuard], canDeactivate: [returnGuard], component: WaitPageComponent },
    { path: 'play-match', canActivate: [matchLoginGuard], canDeactivate: [returnGuard], component: QuestionAreaComponent },
    { path: 'results', canActivate: [matchLoginGuard], component: ResultsPageComponent },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { useHash: true })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
