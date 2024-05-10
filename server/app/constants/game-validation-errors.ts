import {
    MAX_CHOICES_NUMBER,
    MAX_DURATION,
    MAX_POINTS,
    MIN_CHOICES_NUMBER,
    MIN_DURATION,
    MIN_POINTS,
    STEP_POINTS,
} from './game-validation-constraints';

const ERROR_REPEAT_CHOICES = 'Il ne doit pas y avoir deux choix identiques dans une question.';
const ERROR_CHOICES_NUMBER = `Il doit y avoir entre ${MIN_CHOICES_NUMBER} et ${MAX_CHOICES_NUMBER} choix.`;
const ERROR_POINTS = `Les points doivent être entre ${MIN_POINTS} et ${MAX_POINTS} et divisibles par ${STEP_POINTS}`;
const ERROR_EMPTY_QUESTION = 'Le texte de la question ne doit pas être vide.';
const ERROR_CHOICES_RATIO = 'Il doit y avoir au moins un choix valide et un choix invalide.';
const ERROR_EMPTY_TITLE = 'Le titre du jeu est vide.';
const ERROR_EMPTY_DESCRIPTION = 'La description du jeu est vide.';
const ERROR_DURATION = `La durée doit être entre ${MIN_DURATION} et ${MAX_DURATION} secondes.`;
const ERROR_QUESTIONS_NUMBER = 'Le jeu doit avoir au moins une question.';
const ERROR_QUESTION_TYPE = 'Le type de la question doit être QCM ou QRL';

export {
    ERROR_CHOICES_NUMBER,
    ERROR_CHOICES_RATIO,
    ERROR_DURATION,
    ERROR_EMPTY_DESCRIPTION,
    ERROR_EMPTY_QUESTION,
    ERROR_EMPTY_TITLE,
    ERROR_POINTS,
    ERROR_QUESTIONS_NUMBER,
    ERROR_QUESTION_TYPE,
    ERROR_REPEAT_CHOICES,
};
