export const NOTFICATION_DURATION = 5000;

export enum BankStatus {
    UNAVAILABLE = "👀 Aucune autre question valide de la banque n'est disponible! 👀",
    AVAILABLE = '🖐 Glissez et déposez une question de la banque dans le jeu! 🖐',
    SUCCESS = 'Question ajoutée à la banque avec succès! 😺',
    FAILURE = "La question n'a pas pu être ajoutée. 😿",
    DUPLICATE = 'Cette question fait déjà partie de la banque! 😾',
    MODIFIED = 'Question modifiée avec succès! 😺',
    DELETED = 'Question supprimée avec succès! 😺',
    UNMODIFIED = "La question n'a pas pu être modifiée. 😿",
    UNRETRIEVED = "Échec d'obtention des questions 😿",
    STILL = 'Échec de supression de la question 😿',
}

export enum QuestionStatus {
    VERIFIED = 'Question vérifiée avec succès! 😺',
    UNVERIFIED = 'Question non vérifiée 😿',
    DUPLICATE = 'Cette question fait déjà partie du jeu! 😾',
}

export enum GameStatus {
    VERIFIED = 'Question vérifiée avec succès! 😺',
    ARCHIVED = 'Question vérifiée et ajoutée à la banque avec succès! 😺',
    DUPLICATE = 'Cette question fait déjà partie de la liste des questions de ce jeu! 😾',
    FAILURE = "Échec d'obtention du jeu 😿",
}

export enum MatchStatus {
    PREPARE = 'Préparez vous pour la prochaine question! ⏳',
}

export enum WarningMessage {
    PENDING = 'Vous avez des modifications non sauvegardés. Êtes-vous certain de vouloir quitter?',
    QUIT = 'Vous êtes sur le point de quitter la partie. Êtes-vous certain de vouloir quitter?',
}

export enum SnackBarError {
    DELETED = "Le jeu sélectionné n'existe plus 😿",
    INVISIBLE = "Le jeu sélectionné n'est plus visible 😿",
}

export enum SnackBarAction {
    REFRESH = 'Actualiser',
}

export enum RandomModeStatus {
    FAILURE = "Il n'y a pas assez de questions pour un jeu aléatoire 😿",
}
