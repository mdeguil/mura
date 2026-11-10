/** Tasks and the planning. */
export const fr = {
    tasks: {
        status: {
            A_FAIRE: 'À faire',
            EN_COURS: 'En cours',
            TERMINE: 'Terminé',
        },
        assignee: {
            choose: 'Choisir le responsable',
            nobody: 'Personne',
        },
    },
    planning: {
        calendar: '📅 Calendrier',
        gantt: '📊 Gantt',
        previousMonth: 'Mois précédent',
        nextMonth: 'Mois suivant',
        today: "Aujourd'hui",
        ganttEmpty: 'Aucune tâche sur cette période.',
        calendarEmpty: "Aucune tâche à planifier pour l'instant.",
    },
}

/** The same, in English. */
export const en: typeof fr = {
    tasks: {
        status: {
            A_FAIRE: 'To do',
            EN_COURS: 'In progress',
            TERMINE: 'Done',
        },
        assignee: {
            choose: 'Choose who is in charge',
            nobody: 'Nobody',
        },
    },
    planning: {
        calendar: '📅 Calendar',
        gantt: '📊 Gantt',
        previousMonth: 'Previous month',
        nextMonth: 'Next month',
        today: 'Today',
        ganttEmpty: 'No task in this period.',
        calendarEmpty: 'No task to plan yet.',
    },
}
