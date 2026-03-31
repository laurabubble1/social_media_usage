import csvFileUrl from '../assets/data/Students_Social_Media_Addiction.csv';

const REQUIRED_COLUMNS = [
    'Student_ID',
    'Age',
    'Gender',
    'Academic_Level',
    'Country',
    'Avg_Daily_Usage_Hours',
    'Most_Used_Platform',
    'Affects_Academic_Performance',
    'Sleep_Hours_Per_Night',
    'Mental_Health_Score',
    'Relationship_Status',
    'Conflicts_Over_Social_Media',
    'Addicted_Score'
];

function validateColumns(columns) {
    const missingColumns = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));

    if (missingColumns.length > 0) {
        throw new Error(`Colonnes CSV manquantes : ${missingColumns.join(', ')}`);
    }
}

function validateParsedRows(rows) {
    if (rows.length === 0) {
        throw new Error('Le fichier CSV est vide.');
    }

    const firstRow = rows[0];

    if (!Number.isFinite(firstRow.student_id) || !firstRow.most_used_platform) {
        throw new Error('Le contenu charge ne correspond pas au CSV attendu.');
    }
}

function parseStudentRow(row) {
    return {
        student_id: +row.Student_ID,
        age: +row.Age,
        gender: row.Gender,
        academic_level: row.Academic_Level,
        country: row.Country,
        avg_daily_usage_hours: +row.Avg_Daily_Usage_Hours,
        most_used_platform: row.Most_Used_Platform,
        affects_academic_performance: row.Affects_Academic_Performance === 'Yes',
        sleep_hours_per_night: +row.Sleep_Hours_Per_Night,
        mental_health_score: +row.Mental_Health_Score,
        relationship_status: row.Relationship_Status,
        conflicts_over_social_media: +row.Conflicts_Over_Social_Media,
        addicted_score: +row.Addicted_Score
    };
}

export async function loadStudentData() {
    const response = await fetch(csvFileUrl);

    if (!response.ok) {
        throw new Error(`Impossible de charger le CSV (${response.status}).`);
    }

    const csvText = await response.text();
    const trimmedText = csvText.trimStart();

    if (trimmedText.startsWith('<!DOCTYPE') || trimmedText.startsWith('<html')) {
        throw new Error('Le chemin du CSV est invalide : le serveur a renvoye une page HTML au lieu des donnees.');
    }

    const rawRows = d3.csvParse(csvText);
    validateColumns(rawRows.columns || []);

    const parsedRows = rawRows.map(parseStudentRow);
    validateParsedRows(parsedRows);

    return parsedRows;
}
