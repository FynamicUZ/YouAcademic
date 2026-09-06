// Subject Configurations per Grade - mirrors the 2026-2027 timetable.
// "Ks" (kurator soati / homeroom) is a form period, not a graded subject, so it
// is deliberately absent. Grades 10-11 list the core only; the two elective
// blocks are appended from ELECTIVE_OPTIONS once the student picks them.
const GRADE_SUBJECTS = {
    '5': ['science', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'music', 'literature', 'ce', 'pe', 'art', 'technology'],
    '6': ['science', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'music', 'literature', 'ce', 'pe', 'art', 'technology'],
    '7': ['science', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'music', 'literature', 'ce', 'pe', 'geography', 'drafting'],
    '8': ['chemistry', 'biology', 'physics', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'literature', 'ce', 'pe', 'geography', 'law'],
    '9': ['chemistry', 'biology', 'physics', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'literature', 'ce', 'pe', 'geography', 'law', 'economics'],
    '10': ['english', 'russian', 'gp', 'math', 'uzbek', 'history', 'pe', 'literature', 'ce', 'mp', 'law'], // Plus electives (OB + OA)
    '11': ['english', 'russian', 'gp', 'math', 'uzbek', 'history', 'pe', 'literature', 'ce', 'mp', 'law']  // Same core as Grade 10, plus electives
};

// The two elective blocks each upper grade runs, per the 2026-2027 timetable.
// Grade 10 splits Chem/Phys/CS against Bio/Phys/CS; Grade 11 splits Phys/Bio/CS
// against Chem/Eco/CS. The OA block's Computer Science uses the separate
// 'computing' key so it can never collide with the OB block's 'cs'.
const ELECTIVE_OPTIONS = {
    '10': {
        ob: ['biology', 'physics', 'cs'],
        oa: ['chemistry', 'physics', 'computing']
    },
    '11': {
        ob: ['physics', 'biology', 'cs'],
        oa: ['chemistry', 'economics', 'computing']
    }
};

// Grades where the student picks an OA and an OB elective on top of the core list
const ELECTIVE_GRADES = ['10', '11'];

function hasElectives(grade) {
    return ELECTIVE_GRADES.includes(String(grade));
}

// Rebuild the OB/OA dropdowns from ELECTIVE_OPTIONS for the given grade, since
// the two blocks differ between Grade 10 and Grade 11. A previously stored pick
// is restored only if the new grade still offers it.
function populateElectiveOptions(grade, ob = '', oa = '') {
    const config = ELECTIVE_OPTIONS[String(grade)] || { ob: [], oa: [] };

    const fill = (elementId, keys, placeholder, selected) => {
        const select = document.getElementById(elementId);
        if (!select) return;
        select.innerHTML = `<option value="" disabled selected>${placeholder}</option>` +
            keys.map(key => {
                const detail = SUBJECT_DETAILS[key] || { name: key };
                return `<option value="${key}">${detail.name}</option>`;
            }).join('');
        setSelectValue(select, keys.includes(selected) ? selected : '');
    };

    fill('elective-ob-input', config.ob, 'Select OB Subject', ob);
    fill('elective-oa-input', config.oa, 'Select OA Subject', oa);
}

// Subject Details (Icons and Names)
const SUBJECT_DETAILS = {
    'science': { name: 'Science', icon: 'fa-flask' },
    'art': { name: 'Art', icon: 'fa-palette' },
    'cs': { name: 'Computer Science', icon: 'fa-laptop-code' },
    'english': { name: 'English', icon: 'fa-language' },
    'math': { name: 'Mathematics', icon: 'fa-calculator' },
    'russian': { name: 'Russian', icon: 'fa-globe' },
    'gp': { name: 'Global Perspectives', icon: 'fa-globe-americas' },
    'uzbek': { name: 'Uzbek Language', icon: 'fa-flag' },
    'history': { name: 'History', icon: 'fa-landmark' },
    'music': { name: 'Music', icon: 'fa-music' },
    'literature': { name: 'Literature', icon: 'fa-book-open' },
    'ce': { name: 'Character Education', icon: 'fa-hands-helping' },
    'pe': { name: 'Physical Education', icon: 'fa-running' },
    'geography': { name: 'Geography', icon: 'fa-globe-europe' },
    'technology': { name: 'Technology', icon: 'fa-tools' },
    'drafting': { name: 'Technical Drawing', icon: 'fa-drafting-compass' },
    'law': { name: 'Law', icon: 'fa-gavel' },
    'chemistry': { name: 'Chemistry', icon: 'fa-vial' },
    'biology': { name: 'Biology', icon: 'fa-dna' },
    'physics': { name: 'Physics', icon: 'fa-atom' },
    'economics': { name: 'Economics', icon: 'fa-chart-line' },
    'computing': { name: 'Computer Science (OA)', icon: 'fa-desktop' },
    'mp': { name: 'MP', icon: 'fa-users' }, // Assuming MP logic if needed later
    'ob': { name: 'OB', icon: 'fa-microscope' },
    'oa': { name: 'OA', icon: 'fa-flask' }
};

// Every grade the app knows about, in progression order. Periods are built from this.
const ALL_GRADES = ['5', '6', '7', '8', '9', '10', '11'];
const SEMESTERS = [1, 2];

// Academic year starts in September (month index 8).
const ACADEMIC_YEAR_START_MONTH = 8;

// Build the canonical period key. Grade maps 1:1 to an academic year, so
// grade + semester uniquely identifies a period without storing the year.
function periodKey(grade, semester) {
    return `${grade}-${semester}`;
}

// Human label for a period key, e.g. "Grade 10 · Semester 2"
function periodLabel(key) {
    const [grade, semester] = key.split('-');
    return `Grade ${grade} · Semester ${semester}`;
}

// Every possible period key, in chronological order
function allPeriodKeys() {
    const keys = [];
    ALL_GRADES.forEach(g => SEMESTERS.forEach(s => keys.push(periodKey(g, s))));
    return keys;
}

// Create an empty period record for a grade/semester
function createPeriodRecord(grade, semester, ob = '', oa = '') {
    return {
        grade: String(grade),
        semester: Number(semester),
        electiveOB: ob,
        electiveOA: oa,
        subjects: [],
        grades: {}
    };
}

// Main Application State
// NOTE: `subjects`, `grades`, `grade`, `electiveOB` and `electiveOA` are NOT
// declared here — they are defined below as accessors that proxy into the
// currently active period. That keeps every existing call site working.
const appState = {
    currentView: 'dashboard',
    currentSubject: null,
    studentName: '', // Empty by default
    sortMode: 'percentage',
    colorFilter: 'all',
    historySubject: null, // Which subject the history trend chart is showing
    activePeriod: '',     // e.g. '10-2'
    anchorGrade: '',      // The grade the student was in during anchorYearStart
    anchorYearStart: 0,   // Calendar year the anchor academic year began (e.g. 2025 => 2025–2026)
    rolloverDismissedFor: '', // Period key the user declined to roll over into
    periods: {}
};

// Scratch record used before the student has picked a grade. Deliberately NOT
// stored in appState.periods — a period only exists once its grade is known,
// which is what keeps checkProfileStatus() forcing the profile modal.
const blankPeriodRecord = createPeriodRecord('', 1);

// The record for the active period. Created on demand so callers never see undefined.
function activePeriodRecord() {
    const key = appState.activePeriod;
    if (!key) return blankPeriodRecord;

    if (!appState.periods[key]) {
        const [grade, semester] = key.split('-');
        appState.periods[key] = createPeriodRecord(grade, semester);
    }
    return appState.periods[key];
}

// Get (creating if needed) the record for any period, carrying electives forward
// from the most recent earlier period so Grade 10 choices don't have to be re-picked.
function ensurePeriod(key) {
    if (appState.periods[key]) return appState.periods[key];

    const [grade, semester] = key.split('-');
    const earlier = Object.keys(appState.periods)
        .filter(k => periodOrder(k) < periodOrder(key))
        .sort((a, b) => periodOrder(b) - periodOrder(a))[0];
    const source = earlier ? appState.periods[earlier] : null;

    const record = createPeriodRecord(grade, semester, source?.electiveOB || '', source?.electiveOA || '');
    appState.periods[key] = record;

    // Populate the subject list for this grade
    const previousActive = appState.activePeriod;
    appState.activePeriod = key;
    updateSubjectsForGrade(record.grade, record.electiveOB, record.electiveOA);
    appState.activePeriod = previousActive;

    return record;
}

// True when the period holds at least one entered mark
function periodHasData(key) {
    const record = appState.periods[key];
    if (!record) return false;
    return Object.values(record.grades).some(entry =>
        entry.semesterTest !== '' || entry.classTests.some(v => v !== '')
    );
}

// Proxy the per-period fields onto appState so the ~70 existing references to
// appState.subjects / appState.grades / appState.grade keep working unchanged.
['subjects', 'grades', 'grade', 'electiveOB', 'electiveOA'].forEach(key => {
    Object.defineProperty(appState, key, {
        get() { return activePeriodRecord()[key]; },
        set(value) { activePeriodRecord()[key] = value; },
        enumerable: true,
        configurable: true
    });
});

// Grading Thresholds
const GRADING_THRESHOLDS = {
    'default': { '5': 85, '4': 75, '3': 60 },
    'special': { '5': 80, '4': 70, '3': 54 } // For Grades 5, 6, 7
};

// `grade` defaults to the active period's grade. The history view passes an
// explicit grade so each period is judged by the thresholds that applied then.
function getThresholds(grade = appState.grade) {
    if (['5', '6', '7'].includes(String(grade))) {
        return GRADING_THRESHOLDS.special;
    }
    return GRADING_THRESHOLDS.default;
}

const STORAGE_KEY = 'academicDataV2';

// The calendar year the current academic year began. Sept–Dec => this year,
// Jan–Aug => last year. (E.g. 10 Aug 2026 is still the 2025–2026 year.)
function currentAcademicYearStart(now = new Date()) {
    return now.getMonth() >= ACADEMIC_YEAR_START_MONTH ? now.getFullYear() : now.getFullYear() - 1;
}

// Which semester the calendar date falls in: Sept–Dec => 1, Jan–Aug => 2.
function currentSemester(now = new Date()) {
    return now.getMonth() >= ACADEMIC_YEAR_START_MONTH ? 1 : 2;
}

// The period the student should be in today, derived from the stored anchor.
// Returns null when there is no anchor yet, or once they're past the last grade.
function expectedPeriod(now = new Date()) {
    if (!appState.anchorGrade || !appState.anchorYearStart) return null;

    const yearsElapsed = currentAcademicYearStart(now) - appState.anchorYearStart;
    const expectedGrade = Number(appState.anchorGrade) + yearsElapsed;
    if (!ALL_GRADES.includes(String(expectedGrade))) return null; // graduated, or before grade 5

    return periodKey(expectedGrade, currentSemester(now));
}

// Chronological ordering of a period key, for comparisons and sorting
function periodOrder(key) {
    const [grade, semester] = key.split('-');
    return Number(grade) * 10 + Number(semester);
}

// Convert the pre-multi-period (v1) storage shape into the v2 shape. Shared with
// firebase-init.js, which needs it for cloud documents written by the old version.
// The v1 data is the student's most recent semester — per the user, semester 2.
function migrateV1(studentInfo, subjects, grades) {
    const grade = String(studentInfo.grade || '');
    const ob = studentInfo.electiveOB || '';
    const oa = studentInfo.electiveOA || '';
    const key = periodKey(grade || ALL_GRADES[ALL_GRADES.length - 1], 2);

    const record = createPeriodRecord(grade, 2, ob, oa);
    record.subjects = Array.isArray(subjects) ? subjects : [];
    record.grades = (grades && typeof grades === 'object') ? grades : {};

    return {
        studentName: studentInfo.name || '',
        activePeriod: key,
        anchorGrade: grade,
        // The v1 data belongs to the academic year that is current at migration time.
        anchorYearStart: currentAcademicYearStart(),
        rolloverDismissedFor: '',
        periods: { [key]: record }
    };
}
window.__migrateV1 = migrateV1;

// Fill in anything a loaded/migrated payload is missing, and normalise old records.
function normalizeState() {
    if (!appState.periods || typeof appState.periods !== 'object') appState.periods = {};

    Object.entries(appState.periods).forEach(([key, record]) => {
        const [grade, semester] = key.split('-');
        record.grade = String(record.grade || grade);
        record.semester = Number(record.semester || semester);
        record.electiveOB = record.electiveOB || '';
        record.electiveOA = record.electiveOA || '';
        if (!Array.isArray(record.subjects)) record.subjects = [];
        if (!record.grades || typeof record.grades !== 'object') record.grades = {};

        // Backfill bestN for data saved before the best-N feature existed
        Object.values(record.grades).forEach(entry => {
            if (entry.bestN === undefined) entry.bestN = 'all';
        });
    });

    // Make sure the active period points at something real
    if (!appState.activePeriod || !appState.periods[appState.activePeriod]) {
        const existing = Object.keys(appState.periods).sort((a, b) => periodOrder(b) - periodOrder(a));
        appState.activePeriod = existing[0] || '';
    }
}

// Apply a plain v2 payload onto appState (used by load and by cloud sync)
function applyStatePayload(payload) {
    appState.studentName = payload.studentName || '';
    appState.activePeriod = payload.activePeriod || '';
    appState.anchorGrade = payload.anchorGrade || '';
    appState.anchorYearStart = payload.anchorYearStart || 0;
    appState.rolloverDismissedFor = payload.rolloverDismissedFor || '';
    appState.periods = payload.periods || {};
    normalizeState();
}
window.__applyStatePayload = applyStatePayload;

// Initialize from localStorage
function initializeApp() {
    const savedV2 = localStorage.getItem(STORAGE_KEY);

    if (savedV2) {
        try {
            applyStatePayload(JSON.parse(savedV2));
        } catch (e) {
            console.error('[init] Could not parse saved data', e);
            applyStatePayload({});
        }
    } else {
        // No v2 data — migrate from the old single-semester keys if they exist.
        // The old keys are deliberately left in place as a one-release safety net.
        const savedStudentInfo = localStorage.getItem('academicStudentInfo');
        const savedSubjects = localStorage.getItem('academicSubjects');
        const savedGrades = localStorage.getItem('academicGrades');

        if (savedStudentInfo || savedSubjects || savedGrades) {
            try {
                applyStatePayload(migrateV1(
                    savedStudentInfo ? JSON.parse(savedStudentInfo) : {},
                    savedSubjects ? JSON.parse(savedSubjects) : [],
                    savedGrades ? JSON.parse(savedGrades) : {}
                ));
                saveAllData();
                console.info('[init] Migrated single-semester data into period ' + appState.activePeriod);
            } catch (e) {
                console.error('[init] Migration failed', e);
                applyStatePayload({});
            }
        }
    }

    // If the active period has a grade but no subjects yet, populate them
    if (appState.activePeriod && appState.grade && appState.subjects.length === 0) {
        updateSubjectsForGrade(appState.grade, appState.electiveOB, appState.electiveOA);
    }

    renderPeriodSelect();
    renderSidebar();

    // Check if profile needs filling
    checkProfileStatus();
}

function checkProfileStatus() {
    const modal = document.getElementById('profile-modal');
    // Force open if name or grade is missing
    if (!appState.studentName || !appState.grade) {
        modal.classList.add('active');
        modal.classList.add('mandatory');

        // Populate fields if they have partial data
        document.getElementById('student-name-input').value = appState.studentName;
        setSelectValue(document.getElementById('student-grade-input'), appState.grade);
        if (hasElectives(appState.grade)) {
            document.getElementById('elective-options').style.display = 'block';
            populateElectiveOptions(appState.grade, appState.electiveOB, appState.electiveOA);
        }

        // Disable closing
        document.querySelector('.close-modal').style.display = 'none';

        showToast('Please complete your profile to continue');
    } else {
        modal.classList.remove('mandatory');
        document.querySelector('.close-modal').style.display = 'block';
    }
}

// Update Subjects based on Grade
function updateSubjectsForGrade(grade, ob, oa) {
    let subjectKeys = GRADE_SUBJECTS[grade] || [];

    if (hasElectives(grade)) {
        if (ob) subjectKeys = [...subjectKeys, ob];
        if (oa) subjectKeys = [...subjectKeys, oa];
    }

    // Convert keys to full objects
    appState.subjects = subjectKeys.map(key => {
        const detail = SUBJECT_DETAILS[key] || { name: key, icon: 'fa-book' };
        return { id: key, name: detail.name, icon: detail.icon };
    });

    // Initialize grades for new subjects if missing
    appState.subjects.forEach(subject => {
        if (!appState.grades[subject.id]) {
            appState.grades[subject.id] = {
                classTests: Array(8).fill(''),
                semesterTest: '',
                bestN: 'all',
                classTestAverage: 0,
                finalPercentage: 0,
                finalGrade: '-'
            };
        }
    });

    saveAllData();
}

// The serialisable slice of appState — everything that should persist and sync.
function buildStatePayload() {
    return {
        studentName: appState.studentName,
        activePeriod: appState.activePeriod,
        anchorGrade: appState.anchorGrade,
        anchorYearStart: appState.anchorYearStart,
        rolloverDismissedFor: appState.rolloverDismissedFor,
        periods: appState.periods
    };
}
window.__buildStatePayload = buildStatePayload;

// Save all data to localStorage
function saveAllData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(buildStatePayload()));
}

// Switch the dashboard to a different period. Creates the period if needed.
// Nothing is ever deleted — this is the core of multi-semester support.
function switchPeriod(key, { silent = false } = {}) {
    if (!key || key === appState.activePeriod) return;

    const wasOnHistory = appState.currentView === 'history';

    ensurePeriod(key);
    appState.activePeriod = key;

    // The open subject may not exist in the new period, so leave the subject view
    appState.currentSubject = null;
    saveAllData();

    renderPeriodSelect();
    renderSidebar();

    // History spans every period, so stay there rather than bouncing to the dashboard
    if (wasOnHistory) {
        renderHistory();
    } else {
        switchToDashboard();
    }

    if (!silent) showToast(`Switched to ${periodLabel(key)}`);
}

// Rebuild the sidebar period dropdown, marking periods that already hold marks
function renderPeriodSelect() {
    const select = document.getElementById('period-select');
    if (!select) return;

    select.innerHTML = '';
    allPeriodKeys().forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = periodLabel(key) + (periodHasData(key) ? ' ●' : '');
        select.appendChild(option);
    });

    // setSelectValue fires 'change', which is what tells the enhanced dropdown
    // to rebuild its option list from the new <option> elements.
    setSelectValue(select, appState.activePeriod || allPeriodKeys()[0]);
}

// Calculate class test average (ignore empty cells)
// bestN: 'all' or an integer 1-8 — when set, average only the top-N highest scores
function calculateClassTestAverage(classTests, bestN = 'all') {
    const validGrades = classTests
        .map(g => parseFloat(g))
        .filter(n => !isNaN(n));

    if (validGrades.length === 0) return 0;

    let gradesToUse = validGrades;
    if (bestN !== 'all') {
        const n = parseInt(bestN);
        if (!isNaN(n) && n > 0 && n < validGrades.length) {
            gradesToUse = [...validGrades].sort((a, b) => b - a).slice(0, n);
        }
    }

    const sum = gradesToUse.reduce((total, g) => total + g, 0);
    return Math.round((sum / gradesToUse.length) * 10) / 10;
}

// Return the set of class-test indices that are counted in the top-N average.
// Used to dim the cells not currently contributing to the grade.
function getCountedCTIndices(classTests, bestN = 'all') {
    const indexed = classTests
        .map((g, i) => ({ i, v: parseFloat(g) }))
        .filter(x => !isNaN(x.v));

    if (bestN === 'all') return new Set(indexed.map(x => x.i));
    const n = parseInt(bestN);
    if (isNaN(n) || n <= 0 || n >= indexed.length) return new Set(indexed.map(x => x.i));

    indexed.sort((a, b) => b.v - a.v);
    return new Set(indexed.slice(0, n).map(x => x.i));
}

// Calculate final percentage
function calculateFinalPercentage(classTestAvg, semesterTest) {
    const semesterNum = parseFloat(semesterTest);
    if (isNaN(semesterNum) || semesterTest === '') return classTestAvg;

    const finalPercent = (classTestAvg * 0.6) + (semesterNum * 0.4);
    return Math.round(finalPercent * 10) / 10;
}

// Determine final grade. `grade` selects which threshold set applies.
function getFinalGrade(percentage, grade) {
    const thresholds = getThresholds(grade);
    if (percentage >= thresholds['5']) return '5';
    if (percentage >= thresholds['4']) return '4';
    if (percentage >= thresholds['3']) return '3';
    if (percentage > 0) return '2';
    return '-';
}

// Get grade color class
function getGradeColorClass(value, grade) {
    const thresholds = getThresholds(grade);
    if (value >= thresholds['5']) return 'grade-excellent';
    if (value >= thresholds['4']) return 'grade-good';
    if (value >= thresholds['3']) return 'grade-average';
    return 'grade-poor';
}

// Get color for value
function getGradeColor(value, grade) {
    const thresholds = getThresholds(grade);
    if (value >= thresholds['5']) return '#10b981';
    if (value >= thresholds['4']) return '#a3e635';
    if (value >= thresholds['3']) return '#f59e0b';
    return '#ef4444';
}

// Get filter category for value
function getGradeFilterCategory(value, grade) {
    const thresholds = getThresholds(grade);
    if (value >= thresholds['5']) return 'excellent';
    if (value >= thresholds['4']) return 'good';
    if (value >= thresholds['3']) return 'average';
    return 'poor';
}

// Validate grade input
function validateGradeInput(value) {
    if (value === '') return '';

    let num = parseFloat(value);
    if (isNaN(num)) return '';

    // Clamp between 0 and 100
    num = Math.max(0, Math.min(100, num));

    // Round to 2 decimal places
    return Math.round(num * 100) / 100;
}

// Update subject grades
function updateSubjectGrades(subjectId, testIndex, value) {
    if (!appState.grades[subjectId]) {
        appState.grades[subjectId] = {
            classTests: Array(8).fill(''),
            semesterTest: '',
            bestN: 'all',
            classTestAverage: 0,
            finalPercentage: 0,
            finalGrade: '-'
        };
    }

    // Validate and update
    const validatedValue = validateGradeInput(value);
    appState.grades[subjectId].classTests[testIndex] = validatedValue;

    // Recalculate
    recalculateSubject(subjectId);

    // Update UI with animations
    animateUpdate();
}

// Update semester test
function updateSemesterTest(subjectId, value) {
    if (!appState.grades[subjectId]) {
        appState.grades[subjectId] = {
            classTests: Array(8).fill(''),
            semesterTest: '',
            bestN: 'all',
            classTestAverage: 0,
            finalPercentage: 0,
            finalGrade: '-'
        };
    }

    // Validate and update
    const validatedValue = validateGradeInput(value);
    appState.grades[subjectId].semesterTest = validatedValue;

    // Recalculate
    recalculateSubject(subjectId);

    // Update UI with animations
    animateUpdate();
}

// Recalculate subject grades
function recalculateSubject(subjectId) {
    const grades = appState.grades[subjectId];
    const classTestAvg = calculateClassTestAverage(grades.classTests, grades.bestN || 'all');
    const finalPercent = calculateFinalPercentage(classTestAvg, grades.semesterTest);
    const finalGrade = getFinalGrade(finalPercent);

    grades.classTestAverage = classTestAvg;
    grades.finalPercentage = finalPercent;
    grades.finalGrade = finalGrade;

    saveAllData();

    if (appState.currentSubject === subjectId) {
        updateSubjectView(subjectId);
    }

    updateDashboardStats();
    if (window.overallChartInstance) renderOverallChart();
    renderSidebar();
}

// Animate updates
function animateUpdate() {
    // Add animation class to summary cards
    document.querySelectorAll('.summary-card').forEach((card, index) => {
        card.classList.remove('slide-up');
        void card.offsetWidth; // Trigger reflow
        card.classList.add('slide-up');
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Animate progress bar
    const progressFill = document.getElementById('overall-progress');
    progressFill.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
}

// Render sidebar
function renderSidebar() {
    const subjectList = document.getElementById('subject-list');
    subjectList.innerHTML = '';

    // Filter subjects based on color filter
    let filteredSubjects = appState.subjects;
    if (appState.colorFilter !== 'all') {
        filteredSubjects = appState.subjects.filter(subject => {
            const grades = appState.grades[subject.id];
            if (!grades || grades.finalPercentage === 0) return false;
            return getGradeFilterCategory(grades.finalPercentage) === appState.colorFilter;
        });
    }

    filteredSubjects.forEach(subject => {
        const li = document.createElement('li');
        li.className = `subject-item ${appState.currentSubject === subject.id ? 'active' : ''}`;
        li.setAttribute('data-id', subject.id);

        const grades = appState.grades[subject.id];
        const percentage = grades ? grades.finalPercentage : 0;

        li.innerHTML = `
            <span class="subject-icon"><i class="fas ${subject.icon}"></i></span>
            <span class="subject-name">${subject.name}</span>
            ${percentage > 0 ? `<span class="subject-percentage">${percentage}%</span>` : ''}
        `;

        li.addEventListener('click', () => switchToSubject(subject.id));
        subjectList.appendChild(li);
    });
}

// Show exactly one view and light up the matching sidebar button
function showView(name) {
    appState.currentView = name;

    document.querySelectorAll('.view').forEach(view => view.classList.remove('active-view'));
    document.getElementById(`${name}-view`).classList.add('active-view');

    document.getElementById('btn-dashboard').classList.toggle('active', name === 'dashboard');
    const historyBtn = document.getElementById('btn-history');
    if (historyBtn) historyBtn.classList.toggle('active', name === 'history');
}

// Switch to subject view
function switchToSubject(subjectId) {
    appState.currentSubject = subjectId;
    showView('subject');

    // Update subject title
    const subject = appState.subjects.find(s => s.id === subjectId);
    if (subject) {
        document.getElementById('subject-name').textContent = subject.name;
        document.getElementById('subject-description').textContent = `Track your performance in ${subject.name}`;
    }

    // Update active state in sidebar
    document.querySelectorAll('.subject-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`.subject-item[data-id="${subjectId}"]`);
    if (activeItem) activeItem.classList.add('active');

    renderSubjectView(subjectId);
}

// Switch to dashboard
function switchToDashboard() {
    appState.currentSubject = null;
    showView('dashboard');

    document.querySelectorAll('.subject-item').forEach(item => {
        item.classList.remove('active');
    });

    renderDashboard();
}

// Switch to the cross-period history view
function switchToHistory() {
    appState.currentSubject = null;
    showView('history');

    document.querySelectorAll('.subject-item').forEach(item => {
        item.classList.remove('active');
    });

    renderHistory();
}

// Render subject view
function renderSubjectView(subjectId) {
    const grades = appState.grades[subjectId] || {
        classTests: Array(8).fill(''),
        semesterTest: '',
        bestN: 'all',
        classTestAverage: 0,
        finalPercentage: 0,
        finalGrade: '-'
    };

    // Update summary cards with animation
    const avgElement = document.getElementById('current-average');
    const gradeElement = document.getElementById('current-grade');

    avgElement.textContent = `${grades.classTestAverage}%`;
    gradeElement.textContent = grades.finalGrade;
    gradeElement.className = `grade-badge ${getGradeColorClass(grades.finalPercentage)}`;

    // Wire best-N selector
    const bestNSelect = document.getElementById('best-n-select');
    if (bestNSelect) {
        // Detach previous onchange before resetting value, so the programmatic set
        // doesn't trigger a spurious recalculate (the custom dropdown listens for
        // 'change' to sync its trigger label — that's harmless).
        bestNSelect.onchange = null;
        setSelectValue(bestNSelect, grades.bestN || 'all');
        bestNSelect.onchange = (e) => {
            appState.grades[subjectId].bestN = e.target.value;
            recalculateSubject(subjectId);
            renderGradeTable(subjectId, appState.grades[subjectId]);
            renderPerformanceChart(subjectId, appState.grades[subjectId]);
        };
    }

    // Add animation
    document.querySelectorAll('.summary-card').forEach((card, index) => {
        card.classList.remove('slide-up');
        void card.offsetWidth;
        card.classList.add('slide-up');
        card.style.animationDelay = `${index * 0.1}s`;
    });

    // Render table
    renderGradeTable(subjectId, grades);

    // Render chart
    renderPerformanceChart(subjectId, grades);
}

// Render grade table
function renderGradeTable(subjectId, grades) {
    const tableBody = document.querySelector('#grade-table tbody');
    tableBody.innerHTML = '';

    const row = document.createElement('tr');
    row.className = 'grade-row';

    // Component cell
    const componentCell = document.createElement('td');
    componentCell.textContent = 'Grades';
    componentCell.style.fontWeight = '600';
    row.appendChild(componentCell);

    // Determine which CT indices are counted toward the best-N average
    const countedIndices = getCountedCTIndices(grades.classTests, grades.bestN || 'all');
    const bestN = grades.bestN || 'all';

    // Class test inputs
    for (let i = 0; i < 8; i++) {
        const cell = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'number';
        input.className = 'grade-input';
        input.dataset.index = i; // Add data index for sequential lookup
        input.min = '0';
        input.max = '100';
        input.step = '0.1';
        input.value = grades.classTests[i] || '';
        input.placeholder = '0-100';

        // Validation: Disable if previous test is empty
        if (i > 0) {
            const prevGrade = grades.classTests[i - 1];
            if (prevGrade === '' || prevGrade === null || prevGrade === undefined) {
                input.disabled = true;
                input.placeholder = '-';
                input.title = "Complete previous Class Test first";
            }
        }

        if (grades.classTests[i]) {
            input.classList.add(getGradeColorClass(grades.classTests[i]));
        }

        // Dim the cells that don't count toward the average under best-N
        if (bestN !== 'all' && grades.classTests[i] !== '' && grades.classTests[i] !== null && !countedIndices.has(i)) {
            cell.classList.add('ct-cell-excluded');
            input.title = (input.title ? input.title + ' — ' : '') + 'Not counted in best-N average';
        }

        input.addEventListener('input', (e) => {
            updateSubjectGrades(subjectId, i, e.target.value);

            // Immediately update input color
            e.target.classList.remove('grade-excellent', 'grade-good', 'grade-average', 'grade-poor');
            if (e.target.value !== '') {
                e.target.classList.add(getGradeColorClass(parseFloat(e.target.value)));
            }

            // Handle sequential enabling/disabling
            const nextInput = document.querySelector(`.grade-input[data-index="${i + 1}"]`);
            if (nextInput) {
                if (e.target.value !== '') {
                    nextInput.disabled = false;
                    nextInput.placeholder = '0-100';
                    nextInput.title = '';
                } else {
                    nextInput.disabled = true;
                    nextInput.placeholder = '-';
                    nextInput.title = "Complete previous Class Test first";
                    // Optional: clear next input value if previous is cleared? 
                    // ideally we shouldn't clear user data automatically unless needed, 
                    // but if they cleared CT1, CT2 is invalid. 
                    // adhering to minimal intervention for now.
                }
            }
        });

        input.addEventListener('blur', (e) => {
            if (e.target.value !== '') {
                e.target.value = validateGradeInput(e.target.value);
                updateSubjectGrades(subjectId, i, e.target.value);
            }
        });

        cell.appendChild(input);
        row.appendChild(cell);
    }

    // Class test average
    const avgCell = document.createElement('td');
    avgCell.className = `grade-cell ${getGradeColorClass(grades.classTestAverage)}`;
    avgCell.textContent = `${grades.classTestAverage}%`;
    row.appendChild(avgCell);

    // Semester test input
    const semesterCell = document.createElement('td');
    const semesterInput = document.createElement('input');
    semesterInput.type = 'number';
    semesterInput.className = 'grade-input';
    semesterInput.min = '0';
    semesterInput.max = '100';
    semesterInput.step = '0.1';
    semesterInput.value = grades.semesterTest || '';
    semesterInput.placeholder = '0-100';

    if (grades.semesterTest) {
        semesterInput.classList.add(getGradeColorClass(grades.semesterTest));
    }

    semesterInput.addEventListener('input', (e) => {
        updateSemesterTest(subjectId, e.target.value);

        // Immediately update input color
        e.target.classList.remove('grade-excellent', 'grade-good', 'grade-average', 'grade-poor');
        if (e.target.value !== '') {
            e.target.classList.add(getGradeColorClass(parseFloat(e.target.value)));
        }
    });

    semesterInput.addEventListener('blur', (e) => {
        if (e.target.value !== '') {
            e.target.value = validateGradeInput(e.target.value);
            updateSemesterTest(subjectId, e.target.value);
        }
    });

    semesterCell.appendChild(semesterInput);
    row.appendChild(semesterCell);

    // Final percentage
    const finalPercentCell = document.createElement('td');
    finalPercentCell.className = `grade-cell ${getGradeColorClass(grades.finalPercentage)}`;
    finalPercentCell.textContent = `${grades.finalPercentage}%`;
    finalPercentCell.style.fontWeight = '700';
    row.appendChild(finalPercentCell);


    tableBody.appendChild(row);
}

// Update subject view (for real-time updates)
function updateSubjectView(subjectId) {
    const grades = appState.grades[subjectId];

    // Update summary with animation
    const avgElement = document.getElementById('current-average');
    const gradeElement = document.getElementById('current-grade');

    avgElement.textContent = `${grades.classTestAverage}%`;
    gradeElement.textContent = grades.finalGrade;
    gradeElement.className = `grade-badge ${getGradeColorClass(grades.finalPercentage)}`;

    // Update table cells
    const row = document.querySelector('#grade-table tbody tr');
    if (row) {
        const bestN = grades.bestN || 'all';
        const countedIndices = getCountedCTIndices(grades.classTests, bestN);
        const colorClasses = ['grade-excellent', 'grade-good', 'grade-average', 'grade-poor'];

        for (let i = 0; i < 8; i++) {
            const ctCell = row.cells[i + 1]; // cells[0] is the "Grades" label
            if (!ctCell) continue;
            const val = grades.classTests[i];
            const hasValue = val !== '' && val !== null && val !== undefined;

            // 1) Refresh best-N excluded state on the cell — top-N set shifts on each edit
            const isExcluded = bestN !== 'all' && hasValue && !countedIndices.has(i);
            ctCell.classList.toggle('ct-cell-excluded', isExcluded);

            // 2) Refresh the input's color class & disabled state from current state
            const input = ctCell.querySelector('input.grade-input');
            if (input) {
                input.classList.remove(...colorClasses);
                if (hasValue) input.classList.add(getGradeColorClass(parseFloat(val)));

                // Sequential enabling: input i is enabled only if input i-1 has a value
                if (i > 0) {
                    const prevVal = grades.classTests[i - 1];
                    const prevHas = prevVal !== '' && prevVal !== null && prevVal !== undefined;
                    input.disabled = !prevHas;
                    input.placeholder = prevHas ? '0-100' : '-';
                    if (!prevHas) input.title = 'Complete previous Class Test first';
                    else if (input.title === 'Complete previous Class Test first') input.title = '';
                }
            }
        }

        // 3) Refresh semester input color class
        const semesterCell = row.cells[10];
        if (semesterCell) {
            const semInput = semesterCell.querySelector('input.grade-input');
            if (semInput) {
                semInput.classList.remove(...colorClasses);
                const sv = grades.semesterTest;
                if (sv !== '' && sv !== null && sv !== undefined) {
                    semInput.classList.add(getGradeColorClass(parseFloat(sv)));
                }
            }
        }

        // Update average cell
        const avgCell = row.cells[9];
        avgCell.textContent = `${grades.classTestAverage}%`;
        avgCell.className = `grade-cell ${getGradeColorClass(grades.classTestAverage)}`;

        // Update final percentage
        const finalPercentCell = row.cells[11];
        finalPercentCell.textContent = `${grades.finalPercentage}%`;
        finalPercentCell.className = `grade-cell ${getGradeColorClass(grades.finalPercentage)}`;

        // Update final grade
        const finalGradeCell = row.cells[12];
        finalGradeCell.innerHTML = `<strong style="font-size: 1.2em;">${grades.finalGrade}</strong>`;
        finalGradeCell.className = `grade-cell ${getGradeColorClass(grades.finalPercentage)}`;
    }

    // Chart refresh — destroy+create. In-place chart.update('none') was unreliable
    // when the canvas lives inside a flex: 1; min-height: 0 container that may have
    // resized since the chart was constructed.
    if (window.performanceChartInstance) {
        renderPerformanceChart(subjectId, grades);
    }
}

// Render performance chart
function renderPerformanceChart(subjectId, grades) {
    const ctx = document.getElementById('performance-chart');

    if (window.performanceChartInstance) {
        window.performanceChartInstance.destroy();
    }

    const labels = ['CT 1', 'CT 2', 'CT 3', 'CT 4', 'CT 5', 'CT 6', 'CT 7', 'CT 8', 'Semester'];
    const data = [];
    const backgroundColors = [];

    // Add class tests
    for (let i = 0; i < 8; i++) {
        if (grades.classTests[i] !== '' && grades.classTests[i] !== null && grades.classTests[i] !== undefined) {
            data.push(parseFloat(grades.classTests[i]));
            backgroundColors.push(getGradeColor(parseFloat(grades.classTests[i])));
        } else {
            data.push(null);
            backgroundColors.push('rgba(148, 163, 184, 0.1)');
        }
    }

    // Add semester test
    if (grades.semesterTest !== '' && grades.semesterTest !== null && grades.semesterTest !== undefined) {
        data.push(parseFloat(grades.semesterTest));
        backgroundColors.push(getGradeColor(parseFloat(grades.semesterTest)));
    } else {
        data.push(null);
        backgroundColors.push('rgba(148, 163, 184, 0.1)');
    }

    window.performanceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Test Scores',
                data: data,
                backgroundColor: backgroundColors,
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.3,
                pointBackgroundColor: backgroundColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value + '%';
                        },
                        stepSize: 20
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8'
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: function (context) {
                            return `Score: ${context.parsed.y}%`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// Render dashboard
function renderDashboard() {
    updateDashboardStats();
    renderOverallChart();

    // Animate stats cards
    document.querySelectorAll('.stat-card').forEach((card, index) => {
        card.classList.remove('slide-up');
        void card.offsetWidth;
        card.classList.add('slide-up');
        card.style.animationDelay = `${index * 0.1}s`;
    });
}

// Update dashboard statistics
function updateDashboardStats() {
    let totalPercentage = 0;
    let subjectCount = 0;
    let bestSubject = { name: 'None', percentage: 0 };
    let weakSubject = { name: 'None', percentage: 100 };

    appState.subjects.forEach(subject => {
        const grades = appState.grades[subject.id];
        if (grades && grades.finalPercentage > 0) {
            totalPercentage += grades.finalPercentage;
            subjectCount++;

            if (grades.finalPercentage > bestSubject.percentage) {
                bestSubject = { name: subject.name, percentage: grades.finalPercentage };
            }

            if (grades.finalPercentage < weakSubject.percentage && grades.finalPercentage > 0) {
                weakSubject = { name: subject.name, percentage: grades.finalPercentage };
            }
        }
    });

    const overallAverage = subjectCount > 0 ? Math.round(totalPercentage / subjectCount) : 0;

    // Calculate GPA
    // Assuming grades 5, 4, 3, 2 mapped directly to numbers
    let totalGradePoints = 0;
    let gpaSubjectCount = 0;

    appState.subjects.forEach(subject => {
        const grades = appState.grades[subject.id];
        if (grades && grades.finalPercentage > 0) {
            const gradeNum = parseInt(grades.finalGrade);
            if (!isNaN(gradeNum)) {
                totalGradePoints += gradeNum;
                gpaSubjectCount++;
            }
        }
    });

    const gpa = gpaSubjectCount > 0 ? (totalGradePoints / gpaSubjectCount).toFixed(2) : '0.0';

    // Update UI
    document.getElementById('overall-average').textContent = `${overallAverage}%`;
    document.getElementById('best-subject').textContent = bestSubject.name;
    document.getElementById('best-grade').textContent = `${bestSubject.percentage}%`;
    document.getElementById('weak-subject').textContent = weakSubject.name;
    document.getElementById('weak-grade').textContent = `${weakSubject.percentage}%`;
    document.getElementById('total-average').textContent = `${overallAverage}%`;

    // Update GPA
    const gpaEl = document.getElementById('gpa-value');
    if (gpaEl) gpaEl.textContent = gpa;

    // Update progress bar
    const progressFill = document.getElementById('overall-progress');
    progressFill.style.width = `${overallAverage}%`;

    // Update student info in sidebar
    document.querySelector('.student-name').textContent = appState.studentName;
    document.querySelector('.student-grade').textContent = appState.grade ? `Grade: ${appState.grade}` : 'Grade: -';
}

// Render overall chart
function renderOverallChart() {
    const ctx = document.getElementById('overall-chart');

    if (window.overallChartInstance) {
        window.overallChartInstance.destroy();
    }

    // Prepare data
    const subjects = [];
    const percentages = [];
    const backgroundColors = [];
    const ids = [];

    appState.subjects.forEach(subject => {
        const grades = appState.grades[subject.id];
        const percentage = grades ? grades.finalPercentage : 0;

        subjects.push(subject.name);
        ids.push(subject.id);
        percentages.push(percentage);
        backgroundColors.push(getGradeColor(percentage));
    });

    // Sort data
    let sortedData;
    if (appState.sortMode === 'percentage') {
        sortedData = subjects.map((name, index) => ({
            name,
            id: ids[index],
            percentage: percentages[index],
            color: backgroundColors[index]
        })).sort((a, b) => b.percentage - a.percentage);
    } else {
        sortedData = subjects.map((name, index) => ({
            name,
            id: ids[index],
            percentage: percentages[index],
            color: backgroundColors[index]
        })).sort((a, b) => a.name.localeCompare(b.name));
    }

    const sortedSubjects = sortedData.map(item => item.name);
    const sortedPercentages = sortedData.map(item => item.percentage);
    const sortedColors = sortedData.map(item => item.color);
    const sortedIds = sortedData.map(item => item.id);

    window.overallChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sortedSubjects,
            datasets: [{
                label: 'Final Percentage',
                data: sortedPercentages,
                backgroundColor: sortedColors,
                borderColor: sortedColors.map(color => color + 'CC'),
                borderWidth: 1,
                borderRadius: 6,
                hoverBackgroundColor: sortedColors.map(color => color + '99')
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const subjectId = sortedIds[index];
                    switchToSubject(subjectId);
                }
            },
            onHover: (event, elements) => {
                event.native.target.style.cursor = elements.length ? 'pointer' : 'default';
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: '#94a3b8',
                        callback: function (value) {
                            return value + '%';
                        },
                        stepSize: 20
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#94a3b8',
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        label: function (context) {
                            const grade = getFinalGrade(context.parsed.y);
                            return `${context.parsed.y}% (Grade: ${grade})`;
                        }
                    }
                },
                legend: {
                    display: false
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// =============================================================================
// History — progress across every recorded period
// =============================================================================

// Period keys that hold at least one mark, oldest first
function recordedPeriods() {
    return Object.keys(appState.periods)
        .filter(periodHasData)
        .sort((a, b) => periodOrder(a) - periodOrder(b));
}

// Short axis label for a period key, e.g. "G10 S2"
function periodShortLabel(key) {
    const [grade, semester] = key.split('-');
    return `G${grade} S${semester}`;
}

// Average final percentage and GPA for one period, judged by that period's own
// grade thresholds (a 5th-grader's 82% is a "5"; a 9th-grader's 82% is a "4").
function periodStats(key) {
    const record = appState.periods[key];
    if (!record) return { average: 0, gpa: 0, count: 0 };

    let total = 0;
    let points = 0;
    let count = 0;

    record.subjects.forEach(subject => {
        const grades = record.grades[subject.id];
        if (!grades || grades.finalPercentage <= 0) return;

        total += grades.finalPercentage;
        const gradeNum = parseInt(getFinalGrade(grades.finalPercentage, record.grade));
        if (!isNaN(gradeNum)) points += gradeNum;
        count++;
    });

    return {
        average: count > 0 ? Math.round(total / count) : 0,
        gpa: count > 0 ? Math.round((points / count) * 100) / 100 : 0,
        count
    };
}

// Every subject that appears in any recorded period, in first-seen order
function allHistorySubjects(keys) {
    const seen = new Map();
    keys.forEach(key => {
        appState.periods[key].subjects.forEach(subject => {
            if (!seen.has(subject.id)) seen.set(subject.id, subject);
        });
    });
    return [...seen.values()];
}

function renderHistory() {
    const keys = recordedPeriods();
    const empty = document.getElementById('history-empty');
    const content = document.getElementById('history-content');

    // One period is a dashboard, not a history — ask for two before drawing trends
    if (keys.length < 2) {
        empty.style.display = 'block';
        content.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    content.style.display = 'block';

    renderHistoryOverallChart(keys);
    renderHistorySubjectPicker(keys);
    renderHistorySubjectChart(keys);
    renderHistoryTable(keys);
}

function renderHistoryOverallChart(keys) {
    const ctx = document.getElementById('history-overall-chart');
    if (window.historyOverallChartInstance) window.historyOverallChartInstance.destroy();

    const stats = keys.map(periodStats);

    window.historyOverallChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: keys.map(periodShortLabel),
            datasets: [
                {
                    label: 'Average %',
                    data: stats.map(s => s.average),
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    borderWidth: 3,
                    tension: 0.3,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBackgroundColor: keys.map((key, i) =>
                        getGradeColor(stats[i].average, appState.periods[key].grade)),
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'GPA',
                    data: stats.map(s => s.gpa),
                    borderColor: '#f59e0b',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointBackgroundColor: '#f59e0b',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    fill: false,
                    yAxisID: 'yGpa'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    beginAtZero: true, max: 100, min: 0,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8', stepSize: 20, callback: v => v + '%' }
                },
                yGpa: {
                    position: 'right',
                    beginAtZero: true, max: 5, min: 0,
                    grid: { display: false },
                    ticks: { color: '#f59e0b', stepSize: 1 }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { labels: { color: '#94a3b8', usePointStyle: true } },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        title: items => periodLabel(keys[items[0].dataIndex]),
                        label: ctxItem => ctxItem.datasetIndex === 0
                            ? `Average: ${ctxItem.parsed.y}%`
                            : `GPA: ${ctxItem.parsed.y}`
                    }
                }
            },
            animation: { duration: 900, easing: 'easeOutQuart' }
        }
    });
}

function renderHistorySubjectPicker(keys) {
    const select = document.getElementById('history-subject-select');
    if (!select) return;

    const subjects = allHistorySubjects(keys);
    if (subjects.length === 0) return;

    // Keep the current pick if it still exists, otherwise fall back to the first
    if (!appState.historySubject || !subjects.some(s => s.id === appState.historySubject)) {
        appState.historySubject = subjects[0].id;
    }

    select.innerHTML = '';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        select.appendChild(option);
    });

    setSelectValue(select, appState.historySubject);
}

function renderHistorySubjectChart(keys) {
    const ctx = document.getElementById('history-subject-chart');
    if (window.historySubjectChartInstance) window.historySubjectChartInstance.destroy();

    const subjectId = appState.historySubject;
    if (!subjectId) return;

    // null for periods where the subject wasn't taken — Chart.js draws a gap
    const data = keys.map(key => {
        const grades = appState.periods[key].grades[subjectId];
        return grades && grades.finalPercentage > 0 ? grades.finalPercentage : null;
    });

    const pointColors = keys.map((key, i) =>
        data[i] === null ? 'rgba(148, 163, 184, 0.2)'
            : getGradeColor(data[i], appState.periods[key].grade));

    const subject = allHistorySubjects(keys).find(s => s.id === subjectId);

    window.historySubjectChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: keys.map(periodShortLabel),
            datasets: [{
                label: subject ? subject.name : 'Subject',
                data,
                borderColor: '#6366f1',
                borderWidth: 3,
                tension: 0.3,
                pointBackgroundColor: pointColors,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                spanGaps: true,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true, max: 100, min: 0,
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8', stepSize: 20, callback: v => v + '%' }
                },
                x: {
                    grid: { color: 'rgba(148, 163, 184, 0.1)' },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30, 41, 59, 0.9)',
                    titleColor: '#f1f5f9',
                    bodyColor: '#cbd5e1',
                    callbacks: {
                        title: items => periodLabel(keys[items[0].dataIndex]),
                        label: ctxItem => {
                            const key = keys[ctxItem.dataIndex];
                            const grade = getFinalGrade(ctxItem.parsed.y, appState.periods[key].grade);
                            return `${ctxItem.parsed.y}% (Grade: ${grade})`;
                        }
                    }
                }
            },
            animation: { duration: 900, easing: 'easeOutQuart' }
        }
    });
}

function renderHistoryTable(keys) {
    const table = document.getElementById('history-table');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Header: Subject | one column per period
    const headRow = document.createElement('tr');
    headRow.innerHTML = '<th>Subject</th>' +
        keys.map(key => `<th>${periodShortLabel(key)}</th>`).join('');
    thead.appendChild(headRow);

    allHistorySubjects(keys).forEach(subject => {
        const row = document.createElement('tr');
        row.className = 'grade-row';

        const nameCell = document.createElement('td');
        nameCell.innerHTML = `<i class="fas ${subject.icon}"></i> ${subject.name}`;
        row.appendChild(nameCell);

        keys.forEach(key => {
            const cell = document.createElement('td');
            const grades = appState.periods[key].grades[subject.id];

            if (grades && grades.finalPercentage > 0) {
                const percentage = grades.finalPercentage;
                const periodGrade = appState.periods[key].grade;
                cell.innerHTML = `<span class="history-cell ${getGradeColorClass(percentage, periodGrade)}">` +
                    `${percentage}%<small>${getFinalGrade(percentage, periodGrade)}</small></span>`;
            } else {
                cell.innerHTML = '<span class="history-cell empty">—</span>';
            }
            row.appendChild(cell);
        });

        tbody.appendChild(row);
    });

    // Footer row: per-period averages
    const footRow = document.createElement('tr');
    footRow.className = 'history-footer-row';
    footRow.innerHTML = '<td><strong>Average</strong></td>' +
        keys.map(key => {
            const { average } = periodStats(key);
            return `<td><span class="history-cell ${getGradeColorClass(average, appState.periods[key].grade)}">` +
                `<strong>${average}%</strong></span></td>`;
        }).join('');
    tbody.appendChild(footRow);
}

// Export data as CSV — every period, one row per subject per period
function exportData() {
    // Create CSV content
    let csvContent = "Period,Subject,Class Test 1,Class Test 2,Class Test 3,Class Test 4,Class Test 5,Class Test 6,Class Test 7,Class Test 8,Best N,Class Test Average,Semester Test,Final Percentage,Final Grade\n";

    const exportKeys = Object.keys(appState.periods).sort((a, b) => periodOrder(a) - periodOrder(b));

    exportKeys.forEach(key => {
        const record = appState.periods[key];

        record.subjects.forEach(subject => {
            const grades = record.grades[subject.id] || {
                classTests: Array(8).fill(''),
                classTestAverage: 0,
                semesterTest: '',
                bestN: 'all',
                finalPercentage: 0,
                finalGrade: '-'
            };

            const row = [
                key,
                `"${subject.name}"`,
                ...grades.classTests.map(test => test || ''),
                grades.bestN || 'all',
                grades.classTestAverage,
                grades.semesterTest || '',
                grades.finalPercentage,
                `"${grades.finalGrade}"`
            ].join(',');

            csvContent += row + '\n';
        });
    });

    // Add summary
    csvContent += '\n\nSUMMARY STATISTICS\n';
    csvContent += `Student Name,${appState.studentName}\n`;
    csvContent += `Active Period,${appState.activePeriod}\n`;
    csvContent += `Periods Exported,${exportKeys.length}\n`;
    csvContent += `Total Average,${document.getElementById('overall-average').textContent}\n`;
    csvContent += `Best Subject,${document.getElementById('best-subject').textContent}\n`;
    csvContent += `Best Grade,${document.getElementById('best-grade').textContent}\n`;
    csvContent += `Weak Subject,${document.getElementById('weak-subject').textContent}\n`;
    csvContent += `Weak Grade,${document.getElementById('weak-grade').textContent}\n`;
    csvContent += `Export Date,${new Date().toLocaleDateString()}\n`;
    csvContent += `Export Time,${new Date().toLocaleTimeString()}\n`;

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `academic-grades-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Grades exported as CSV successfully!');
}

// Parse a single CSV line into an array of field strings, honoring "" quotes
function parseCsvRow(line) {
    const fields = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inQuotes) {
            if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
            else if (c === '"') { inQuotes = false; }
            else { cur += c; }
        } else {
            if (c === '"') inQuotes = true;
            else if (c === ',') { fields.push(cur); cur = ''; }
            else cur += c;
        }
    }
    fields.push(cur);
    return fields.map(f => f.trim());
}

// Parse the CSV text produced by exportData (best-effort, tolerant).
// Handles three generations of the format:
//   15 cols — Period,Subject,CT1..8,BestN,CTAvg,Semester,Final%,Grade  (current)
//   14 cols — Subject,CT1..8,BestN,CTAvg,Semester,Final%,Grade         (pre-periods)
//   13 cols — Subject,CT1..8,CTAvg,Semester,Final%,Grade               (pre-bestN)
// Rows without a Period column land in the active period.
function parseCsvImport(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) throw new Error('File is empty or has no data rows');

    const header = parseCsvRow(lines[0]);
    const firstCol = (header[0] || '').toLowerCase();
    if (firstCol !== 'subject' && firstCol !== 'period') {
        throw new Error('Header does not look like an exported grades CSV');
    }

    // When a Period column leads, every field index shifts right by one
    const hasPeriod = firstCol === 'period';
    const offset = hasPeriod ? 1 : 0;

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const raw = lines[i];
        if (!raw.trim()) continue;
        // Stop at the SUMMARY STATISTICS block — its first cell is the label, not data
        if (/^summary statistics/i.test(raw)) break;

        const f = parseCsvRow(raw);
        const name = (f[offset] || '').trim();
        if (!name) continue;

        // Subject rows have at least 10 columns (subject + 8 CTs + something else)
        if (f.length < 10 + offset) continue;

        // Pre-best-N exports had no Best N column. Detect by checking whether the
        // column after the 8 class tests looks like a bestN value ('all' or 1-8).
        const bestNCol = (f[offset + 9] || '').toLowerCase();
        const hasBestN = bestNCol === 'all' || /^[1-8]$/.test(bestNCol);

        const classTests = [];
        for (let k = 1; k <= 8; k++) classTests.push(f[offset + k] || '');

        const bestN = hasBestN ? (bestNCol === 'all' ? 'all' : Number(bestNCol)) : 'all';
        const semesterTest = f[offset + (hasBestN ? 11 : 10)] || '';

        // Only accept period keys the app actually knows about
        const rawPeriod = hasPeriod ? (f[0] || '').trim() : '';
        const period = allPeriodKeys().includes(rawPeriod) ? rawPeriod : null;

        rows.push({ period, name, classTests, bestN, semesterTest });
    }
    return { rows };
}

// Apply parsed CSV rows: update matching subjects, create new ones for unknowns.
// Rows are grouped by period so a single file can restore the whole school career.
function applyCsvImport(rows) {
    let updated = 0;
    let created = 0;
    const touchedPeriods = new Set();

    rows.forEach((row, i) => {
        const key = row.period || appState.activePeriod;
        if (!key) return;

        const record = ensurePeriod(key);
        touchedPeriods.add(key);

        let subject = record.subjects.find(s => s.name.toLowerCase() === row.name.toLowerCase());
        if (!subject) {
            subject = {
                id: row.name.toLowerCase().replace(/\s+/g, '-') + '-' + (Date.now() + i),
                name: row.name,
                icon: 'fa-book'
            };
            record.subjects.push(subject);
            created++;
        } else {
            updated++;
        }

        const classTests = row.classTests.slice(0, 8);
        const classTestAverage = calculateClassTestAverage(classTests, row.bestN);
        const finalPercentage = calculateFinalPercentage(classTestAverage, row.semesterTest);

        record.grades[subject.id] = {
            classTests,
            semesterTest: row.semesterTest,
            bestN: row.bestN,
            classTestAverage,
            finalPercentage,
            // Judged by the grade of the period the row belongs to, not the active one
            finalGrade: getFinalGrade(finalPercentage, record.grade)
        };
    });

    saveAllData();
    renderPeriodSelect();
    renderSidebar();
    renderDashboard();
    if (appState.currentSubject) renderSubjectView(appState.currentSubject);

    showToast(`Imported ${rows.length} row${rows.length === 1 ? '' : 's'} across ` +
        `${touchedPeriods.size} period${touchedPeriods.size === 1 ? '' : 's'} (${created} new, ${updated} updated)`);
}

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Set icon based on type
    const icon = toast.querySelector('i');
    icon.className = type === 'success' ? 'fas fa-check-circle' :
        type === 'error' ? 'fas fa-exclamation-circle' :
            'fas fa-info-circle';

    toastMessage.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Reset all data
function resetAllData(removeCustomSubjects = false, deleteProfile = false, allPeriods = false) {
    if (deleteProfile) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('academicStudentInfo');
        localStorage.removeItem('academicSubjects');
        localStorage.removeItem('academicGrades');
        location.reload();
        return;
    }

    const targetKeys = allPeriods
        ? Object.keys(appState.periods)
        : [appState.activePeriod].filter(Boolean);

    // Keep only default subjects when asked to drop custom ones
    const defaultSubjectIds = ['english', 'russian', 'uzbek', 'cs', 'chemistry', 'biology',
        'physics', 'math', 'uzbek-lit', 'history', 'geography', 'pe', 'ce', 'gp'];

    targetKeys.forEach(key => {
        const record = appState.periods[key];
        if (!record) return;

        if (removeCustomSubjects) {
            record.subjects = record.subjects.filter(subject =>
                defaultSubjectIds.includes(subject.id)
            );
        }

        // Blank every remaining subject's marks
        record.grades = {};
        record.subjects.forEach(subject => {
            record.grades[subject.id] = {
                classTests: Array(8).fill(''),
                semesterTest: '',
                bestN: 'all',
                classTestAverage: 0,
                finalPercentage: 0,
                finalGrade: '-'
            };
        });
    });

    saveAllData();

    // Update UI
    if (appState.currentSubject) {
        renderSubjectView(appState.currentSubject);
    }

    renderPeriodSelect();
    renderDashboard();
    renderSidebar();
    showToast(allPeriods
        ? 'All periods have been reset.'
        : `${periodLabel(appState.activePeriod)} has been reset.`, 'info');
}

// Show reset confirmation modal
function showResetModal() {
    const modal = document.getElementById('reset-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset checkbox state
    document.getElementById('reset-subjects').checked = false;
    document.getElementById('reset-profile-data').checked = false;

    // Default the scope back to the safer "this period only"
    const periodRadio = document.querySelector('input[name="reset-scope"][value="period"]');
    if (periodRadio) periodRadio.checked = true;

    const scopeLabel = document.getElementById('reset-scope-label');
    if (scopeLabel) scopeLabel.textContent = appState.activePeriod ? periodLabel(appState.activePeriod) : 'current';
}

// Close all modals
// Close all modals
function closeAllModals() {
    const activeModals = document.querySelectorAll('.modal.active');

    if (activeModals.length === 0) return;

    activeModals.forEach(modal => {
        modal.classList.add('closing');
    });

    setTimeout(() => {
        activeModals.forEach(modal => {
            modal.classList.remove('active', 'closing');
        });
        document.body.style.overflow = 'auto';
    }, 300); // 300ms matches CSS animation duration
}

// Show profile modal
function showProfileModal() {
    const modal = document.getElementById('profile-modal');

    // Populate form fields
    document.getElementById('student-name-input').value = appState.studentName;
    setSelectValue(document.getElementById('student-grade-input'), appState.grade);

    // Electives apply to the upper grades only
    const electiveOptions = document.getElementById('elective-options');
    if (hasElectives(appState.grade)) {
        electiveOptions.style.display = 'block';
        populateElectiveOptions(appState.grade, appState.electiveOB, appState.electiveOA);
    } else {
        electiveOptions.style.display = 'none';
        populateElectiveOptions('', '', '');
    }

    // Reset new subject form
    document.getElementById('new-subject-name').value = '';
    document.querySelectorAll('.icon-option').forEach(icon => {
        icon.classList.remove('active');
    });

    // Make it explicit that subject edits are scoped to one period
    const periodHint = document.getElementById('manage-subjects-period');
    if (periodHint) {
        periodHint.textContent = appState.activePeriod ? periodLabel(appState.activePeriod) : 'the current period';
    }

    // Populate manage subjects list
    const manageList = document.getElementById('manage-subjects-list');
    manageList.innerHTML = '';

    appState.subjects.forEach((subject, index) => {
        const isDefault = ['english', 'russian', 'uzbek', 'cs', 'chemistry', 'biology',
            'physics', 'math', 'uzbek-lit', 'history', 'pe', 'ce', 'gp',
            'economics', 'computing', 'ob', 'oa'] // Added electives to default list
            .includes(subject.id);

        const item = document.createElement('div');
        item.className = 'manage-subject-item';
        item.innerHTML = `
            <div class="subject-info">
                <i class="fas ${subject.icon}"></i>
                <span>${subject.name}</span>
                ${isDefault ? '<span class="subject-tag">Default</span>' : ''}
            </div>
            <div class="subject-actions">
                ${!isDefault ? `
                    <button class="icon-btn btn-delete-subject" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
            </div>
        `;
        manageList.appendChild(item);
    });

    // Add event listeners for delete buttons
    document.querySelectorAll('.btn-delete-subject').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = parseInt(e.target.closest('.btn-delete-subject').dataset.index);
            deleteSubject(index);
        });
    });

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Add new subject
function addNewSubject() {
    const nameInput = document.getElementById('new-subject-name');
    const name = nameInput.value.trim();

    if (!name) {
        showToast('Please enter a subject name', 'error');
        return;
    }

    // Check for duplicates
    if (appState.subjects.some(subject => subject.name.toLowerCase() === name.toLowerCase())) {
        showToast('Subject already exists', 'error');
        return;
    }

    // Get selected icon
    const selectedIcon = document.querySelector('.icon-option.active');
    const icon = selectedIcon ? selectedIcon.dataset.icon : 'fa-book';

    // Create new subject
    const newSubject = {
        id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
        name: name,
        icon: icon
    };

    appState.subjects.push(newSubject);
    appState.grades[newSubject.id] = {
        classTests: Array(8).fill(''),
        semesterTest: '',
        bestN: 'all',
        classTestAverage: 0,
        finalPercentage: 0,
        finalGrade: '-'
    };

    saveAllData();
    renderSidebar();
    nameInput.value = '';

    // Reset icon selection
    document.querySelectorAll('.icon-option').forEach(icon => {
        icon.classList.remove('active');
    });

    // Update manage list
    showProfileModal();

    showToast(`Subject "${name}" added successfully!`);
}

// Delete subject
function deleteSubject(index) {
    const subject = appState.subjects[index];

    if (confirm(`Are you sure you want to delete "${subject.name}"? This will also delete all grades for this subject.`)) {
        // Remove from subjects
        appState.subjects.splice(index, 1);

        // Remove grades
        delete appState.grades[subject.id];

        saveAllData();
        renderSidebar();

        // If we're currently viewing this subject, go back to dashboard
        if (appState.currentSubject === subject.id) {
            switchToDashboard();
        }

        // Update profile modal
        showProfileModal();

        showToast(`Subject "${subject.name}" deleted.`);
    }
}

// Toggle theme
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');

    if (body.classList.contains('dark-mode')) {
        body.classList.remove('dark-mode');
        icon.className = 'fas fa-sun';
        showToast('Switched to light mode');
    } else {
        body.classList.add('dark-mode');
        icon.className = 'fas fa-moon';
        showToast('Switched to dark mode');
    }

    // Update charts if they exist
    if (appState.currentSubject && window.performanceChartInstance) {
        renderPerformanceChart(appState.currentSubject, appState.grades[appState.currentSubject]);
    }
    if (window.overallChartInstance) {
        renderOverallChart();
    }
    if (appState.currentView === 'history') {
        renderHistory();
    }
}

// Custom Confirm Modal. `message` may contain HTML. `onCancel` is optional and
// only fires on an explicit Cancel click, not on dismissal by other means.
function showConfirmModal(message, onConfirm, onCancel) {
    const modal = document.getElementById('custom-confirm-modal');
    const messageEl = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('btn-modal-confirm');
    const cancelBtn = document.getElementById('btn-modal-cancel');

    messageEl.innerHTML = message;
    modal.classList.add('active');

    // Remove old listeners
    const newConfirmBtn = confirmBtn.cloneNode(true);
    const newCancelBtn = cancelBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    newConfirmBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        onConfirm();
    });

    newCancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        if (onCancel) onCancel();
    });
}

// Offer to move into the new school year once September rolls around.
// Declining is remembered so the prompt doesn't reappear every reload.
function checkAcademicYearRollover() {
    const expected = expectedPeriod();
    if (!expected || !appState.activePeriod) return;

    // Only ever move forward, and never re-ask about a period already declined
    if (periodOrder(expected) <= periodOrder(appState.activePeriod)) return;
    if (appState.rolloverDismissedFor === expected) return;

    const [grade, semester] = expected.split('-');
    const isNewGrade = grade !== appState.grade;
    const message = isNewGrade
        ? `A new school year has started. Move to <strong>Grade ${grade}, Semester ${semester}</strong>?<br><br>` +
          `Your Grade ${appState.grade} records are kept and stay available from the period switcher.`
        : `Semester ${semester} has started. Switch to <strong>${periodLabel(expected)}</strong>?<br><br>` +
          `Your Semester 1 records are kept.`;

    showConfirmModal(message,
        () => switchPeriod(expected, { silent: true }),
        () => {
            appState.rolloverDismissedFor = expected;
            saveAllData();
        }
    );
}

// Initialize the application
function initApp() {
    // Initialize data
    initializeApp();

    // Render initial UI
    renderSidebar();
    renderDashboard();

    // Set up event listeners
    document.getElementById('btn-dashboard').addEventListener('click', switchToDashboard);
    document.getElementById('btn-history').addEventListener('click', switchToHistory);
    document.getElementById('btn-back').addEventListener('click', switchToDashboard);
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-reset').addEventListener('click', showResetModal);
    document.getElementById('btn-profile').addEventListener('click', showProfileModal);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('btn-add-subject').addEventListener('click', showProfileModal);

    // Period switcher. switchPeriod() no-ops when the value already matches, which
    // is what keeps renderPeriodSelect()'s programmatic setSelectValue from looping.
    document.getElementById('period-select').addEventListener('change', (e) => {
        switchPeriod(e.target.value);
    });

    // History subject picker
    document.getElementById('history-subject-select').addEventListener('change', (e) => {
        if (!e.target.value || e.target.value === appState.historySubject) return;
        appState.historySubject = e.target.value;
        renderHistorySubjectChart(recordedPeriods());
    });

    // Rebuild this period's subject list from the defaults for its grade
    document.getElementById('btn-restore-subjects').addEventListener('click', () => {
        if (!appState.activePeriod) return;
        showConfirmModal(
            `Restore the default subjects for <strong>${periodLabel(appState.activePeriod)}</strong>?<br><br>` +
            `Custom subjects added to this period will be removed. Marks for the default subjects are kept.`,
            () => {
                updateSubjectsForGrade(appState.grade, appState.electiveOB, appState.electiveOA);
                renderSidebar();
                renderDashboard();
                showProfileModal();
                showToast('Default subjects restored for this period.');
            }
        );
    });

    // Mobile sidebar drawer wiring
    const sidebar = document.querySelector('.sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');
    const openMobileMenu = () => {
        sidebar.classList.add('open');
        backdrop.classList.add('active');
    };
    const closeMobileMenu = () => {
        sidebar.classList.remove('open');
        backdrop.classList.remove('active');
    };
    document.getElementById('btn-mobile-menu').addEventListener('click', openMobileMenu);
    document.getElementById('btn-sidebar-close').addEventListener('click', closeMobileMenu);
    backdrop.addEventListener('click', closeMobileMenu);

    // Auto-close the drawer when a sidebar action is tapped on mobile.
    // Use delegation since subjects are re-rendered dynamically.
    sidebar.addEventListener('click', (e) => {
        const target = e.target.closest('.sidebar-btn, .subject-item');
        if (target && window.matchMedia('(max-width: 992px)').matches) {
            closeMobileMenu();
        }
    });

    // Color filter buttons
    document.querySelectorAll('.color-filter').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.color-filter').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            appState.colorFilter = this.dataset.color;
            renderSidebar();
        });
    });

    // Sort buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            appState.sortMode = this.dataset.sort;
            renderOverallChart();
        });
    });

    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!document.getElementById('profile-modal').classList.contains('mandatory')) {
                closeAllModals();
            }
        });
    });

    // Confirm reset button
    document.getElementById('btn-confirm-reset').addEventListener('click', () => {
        const removeCustomSubjects = document.getElementById('reset-subjects').checked;
        const deleteProfile = document.getElementById('reset-profile-data').checked;
        const scope = document.querySelector('input[name="reset-scope"]:checked');
        const allPeriods = scope ? scope.value === 'all' : false;
        resetAllData(removeCustomSubjects, deleteProfile, allPeriods);
        closeAllModals();
    });

    // CSV import
    const importInput = document.getElementById('import-csv-input');
    document.getElementById('btn-import-csv').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const result = parseCsvImport(ev.target.result);
                if (!result.rows.length) {
                    showToast('No subject rows found in CSV', 'error');
                    return;
                }
                const periodCount = new Set(
                    result.rows.map(r => r.period || appState.activePeriod)
                ).size;
                showConfirmModal(
                    `Import ${result.rows.length} row(s) across ${periodCount} period(s) from CSV? ` +
                    `This will overwrite grades for any matching subjects.`,
                    () => applyCsvImport(result.rows)
                );
            } catch (err) {
                console.error(err);
                showToast('Could not parse CSV: ' + err.message, 'error');
            } finally {
                importInput.value = '';
            }
        };
        reader.onerror = () => showToast('Could not read file', 'error');
        reader.readAsText(file);
    });

    // Save profile button
    document.getElementById('btn-save-profile').addEventListener('click', () => {
        const newName = document.getElementById('student-name-input').value.trim();
        const newGrade = document.getElementById('student-grade-input').value;
        const newOB = document.getElementById('elective-ob-input').value;
        const newOA = document.getElementById('elective-oa-input').value;

        // Validation
        if (!newName || !newGrade) {
            showToast('Please fill in all required fields (Name, Grade)', 'error');
            return;
        }

        if (hasElectives(newGrade) && (!newOB || !newOA)) {
            showToast(`Please select both OB and OA subjects for Grade ${newGrade}`, 'error');
            return;
        }

        // Physics sits in both Grade 10 blocks, so the same subject could be
        // picked twice and collapse into a single tracked subject.
        if (hasElectives(newGrade) && newOB === newOA) {
            showToast('Please pick two different elective subjects', 'error');
            return;
        }

        const wasUnset = !appState.activePeriod;
        const gradeChanged = newGrade !== appState.grade;
        const electivesChanged = hasElectives(newGrade) &&
            (newOB !== appState.electiveOB || newOA !== appState.electiveOA);

        appState.studentName = newName;

        if (wasUnset || gradeChanged) {
            // The grade now selects which period is being viewed. Switching is
            // non-destructive: an existing period keeps its marks, a new one is
            // created empty. Keep the semester the user was already looking at.
            const semester = appState.activePeriod
                ? Number(appState.activePeriod.split('-')[1])
                : currentSemester();
            const key = periodKey(newGrade, semester);
            const isNewPeriod = !appState.periods[key];

            ensurePeriod(key);
            appState.activePeriod = key;
            appState.currentSubject = null;

            // First-ever save: anchor the school-year progression to this grade
            if (wasUnset) {
                appState.anchorGrade = newGrade;
                appState.anchorYearStart = currentAcademicYearStart();
            }

            appState.electiveOB = newOB;
            appState.electiveOA = newOA;

            // A brand-new period needs its subject list built for this grade
            if (isNewPeriod) updateSubjectsForGrade(newGrade, newOB, newOA);
        } else if (electivesChanged) {
            // Swap the elective subjects in place, keeping every other subject's marks
            const oldElectives = [appState.electiveOB, appState.electiveOA].filter(Boolean);
            appState.electiveOB = newOB;
            appState.electiveOA = newOA;

            oldElectives.forEach(id => {
                if (id === newOB || id === newOA) return;
                appState.subjects = appState.subjects.filter(s => s.id !== id);
                delete appState.grades[id];
            });

            [newOB, newOA].filter(Boolean).forEach(id => {
                if (appState.subjects.some(s => s.id === id)) return;
                const detail = SUBJECT_DETAILS[id] || { name: id, icon: 'fa-book' };
                appState.subjects.push({ id, name: detail.name, icon: detail.icon });
                appState.grades[id] = {
                    classTests: Array(8).fill(''),
                    semesterTest: '',
                    bestN: 'all',
                    classTestAverage: 0,
                    finalPercentage: 0,
                    finalGrade: '-'
                };
            });
        }

        saveAllData();

        // Immediate UI Update
        renderPeriodSelect();
        renderSidebar();
        switchToDashboard();

        // Remove mandatory status if set
        const modal = document.getElementById('profile-modal');
        modal.classList.remove('mandatory');
        document.querySelector('.close-modal').style.display = 'block';

        closeAllModals();
        showToast('Profile updated successfully!');
    });

    // Grade selection change — show the elective pickers only for the upper grades
    document.getElementById('student-grade-input').addEventListener('change', function () {
        const showElectives = hasElectives(this.value);
        document.getElementById('elective-options').style.display = showElectives ? 'block' : 'none';
        // Grade 10 and Grade 11 run different blocks, so refill on every change
        populateElectiveOptions(showElectives ? this.value : '', appState.electiveOB, appState.electiveOA);
    });

    // Add subject button
    document.getElementById('btn-confirm-add').addEventListener('click', addNewSubject);

    // Icon selection
    document.querySelectorAll('.icon-option').forEach(icon => {
        icon.addEventListener('click', function () {
            document.querySelectorAll('.icon-option').forEach(i => i.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // Keyboard shortcuts
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl shortcuts
        if (e.ctrlKey && e.key === 'e') {
            e.preventDefault();
            exportData();
        }
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            showResetModal();
        }
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            switchToDashboard();
        }
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            showProfileModal();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            if (!document.getElementById('profile-modal').classList.contains('mandatory')) {
                closeAllModals();
            }
        }

        // Enter key functionality
        if (e.key === 'Enter') {
            // Check active modals
            const profileModal = document.getElementById('profile-modal');
            const resetModal = document.getElementById('reset-modal');

            if (resetModal.classList.contains('active')) {
                e.preventDefault();
                // Confirm reset
                document.getElementById('btn-confirm-reset').click();
                return;
            }

            if (profileModal.classList.contains('active')) {
                // Check if adding new subject
                if (document.activeElement.id === 'new-subject-name') {
                    e.preventDefault();
                    addNewSubject();
                    return;
                }

                // If not in a specific input that needs Enter for other things, save profile
                // But allow default behavior if focused on other inputs unless we want to submit form
                // There are student-name-input and student-id-input

                // If focus is on name or ID input, save
                if (document.activeElement.id === 'student-name-input' ||
                    document.activeElement.id === 'student-id-input') {
                    e.preventDefault();
                    document.getElementById('btn-save-profile').click();
                } else if (!document.activeElement.classList.contains('form-control')) {
                    // Fallback for general modal focus
                    e.preventDefault();
                    document.getElementById('btn-save-profile').click();
                }
                return;
            }

            // Handle inputs in grid (blur to save)
            if (document.activeElement.tagName === 'INPUT' &&
                document.activeElement.classList.contains('grade-input')) {
                document.activeElement.blur();
            }
        }
    });

    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (!modal.classList.contains('mandatory')) {
                    closeAllModals();
                }
            }
        });
    });

    // Show welcome message, then offer the new-school-year move if one is due.
    // Deferred so it never competes with the mandatory profile modal on first run.
    setTimeout(() => {
        showToast('Welcome to Academic Dashboard! Start by entering your grades.');

        const profileModal = document.getElementById('profile-modal');
        if (!profileModal.classList.contains('mandatory')) {
            checkAcademicYearRollover();
        }
    }, 1000);
}

// =============================================================================
// Custom <select> replacement — visual dropdown that keeps the native <select>
// underneath for value storage and 'change' event compatibility.
// =============================================================================

function enhanceSelect(selectEl) {
    if (!selectEl || selectEl.dataset.enhanced) return;
    selectEl.dataset.enhanced = '1';
    selectEl.style.display = 'none';

    const wrap = document.createElement('div');
    wrap.className = 'custom-select';
    // Match width hints (modal selects fill container; in-card selects size to content)
    if (selectEl.closest('.modal-body')) wrap.classList.add('full-width');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select-trigger';
    trigger.innerHTML = '<span class="custom-select-label"></span><span class="custom-select-chevron" aria-hidden="true"></span>';

    const list = document.createElement('ul');
    list.className = 'custom-select-options';
    list.setAttribute('role', 'listbox');

    function rebuild() {
        list.innerHTML = '';
        const opts = [...selectEl.options];
        opts.forEach(opt => {
            const li = document.createElement('li');
            li.className = 'custom-select-option' + (opt.value === selectEl.value ? ' selected' : '');
            li.textContent = opt.textContent;
            li.dataset.value = opt.value;
            li.setAttribute('role', 'option');
            if (opt.disabled) li.classList.add('disabled');
            li.addEventListener('click', (e) => {
                e.stopPropagation();
                if (opt.disabled) return;
                selectEl.value = opt.value;
                selectEl.dispatchEvent(new Event('change', { bubbles: true }));
                close();
            });
            list.appendChild(li);
        });
        const sel = selectEl.options[selectEl.selectedIndex];
        trigger.querySelector('.custom-select-label').textContent = sel ? sel.textContent : '';
    }

    function positionList() {
        const rect = trigger.getBoundingClientRect();
        const listHeight = list.offsetHeight || 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUp = spaceBelow < listHeight + 12 && rect.top > listHeight + 12;
        list.style.position = 'fixed';
        list.style.left = rect.left + 'px';
        list.style.minWidth = rect.width + 'px';
        if (openUp) {
            list.style.top = (rect.top - listHeight - 6) + 'px';
        } else {
            list.style.top = (rect.bottom + 6) + 'px';
        }
    }

    function open() {
        // Close any other open dropdowns
        document.querySelectorAll('.custom-select-options.cs-open').forEach(o => o.classList.remove('cs-open'));
        document.querySelectorAll('.custom-select.open').forEach(o => o.classList.remove('open'));

        wrap.classList.add('open');
        // Portal the list to <body> so no ancestor overflow/transform/stacking can clip it
        if (list.parentElement !== document.body) document.body.appendChild(list);
        list.classList.add('cs-open');
        positionList();

        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onKey);
        window.addEventListener('resize', close);
        // capture=true to catch scrolls on inner scrollable elements (they don't bubble)
        window.addEventListener('scroll', onOuterScroll, true);
    }

    function close() {
        wrap.classList.remove('open');
        list.classList.remove('cs-open');
        list.style.position = '';
        list.style.top = '';
        list.style.left = '';
        list.style.minWidth = '';
        document.removeEventListener('click', onDocClick);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('resize', close);
        window.removeEventListener('scroll', onOuterScroll, true);
    }
    function onDocClick(e) { if (!wrap.contains(e.target) && !list.contains(e.target)) close(); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    // Only close if the scroll happened OUTSIDE the dropdown list itself —
    // scrolling within the options (to reach Best 7/8) must keep it open.
    function onOuterScroll(e) {
        if (list.contains(e.target) || e.target === list) return;
        close();
    }

    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (selectEl.disabled) return;
        wrap.classList.contains('open') ? close() : open();
    });

    // Keep custom UI in sync when external code sets the native value
    selectEl.addEventListener('change', rebuild);

    wrap.appendChild(trigger);
    wrap.appendChild(list);
    selectEl.insertAdjacentElement('afterend', wrap);
    rebuild();
}

// Programmatic value setter — sets .value AND notifies enhanced dropdown to re-sync
function setSelectValue(el, value) {
    if (!el) return;
    el.value = value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
}
window.setSelectValue = setSelectValue;

function enhanceAllSelects() {
    document.querySelectorAll('select').forEach(enhanceSelect);
}

// Start the application
document.addEventListener('DOMContentLoaded', () => {
    initApp();
    enhanceAllSelects();
});

// Expose state and key entry points to other modules (e.g. firebase-init.js).
// Functions declared with `function` already attach to `window`, but `const`
// declarations do not — so we expose them explicitly here.
window.appState = appState;
window.saveAllData = saveAllData;
window.renderSidebar = renderSidebar;
window.renderDashboard = renderDashboard;
window.renderPeriodSelect = renderPeriodSelect;
window.showToast = showToast;

// Goal Calculator Logic
function showGoalModal() {
    const modal = document.getElementById('goal-modal');
    document.getElementById('goal-results').style.display = 'none';
    modal.classList.add('active');

    // Add listeners here to avoid errors if elements don't exist yet/re-binding
    const btnCalculate = document.getElementById('btn-calculate-goal');
    // Remove old listener to prevent duplicates (simple way: clone replace or just ensure init once)
    // Since initApp is called once, we can move the binding inside initApp or just rely on global binding if elements exist
}

// Add listeners safely after DOM load
document.addEventListener('DOMContentLoaded', () => {
    const btnOpen = document.getElementById('btn-open-goal');
    if (btnOpen) btnOpen.addEventListener('click', showGoalModal);

    const btnCalc = document.getElementById('btn-calculate-goal');
    if (btnCalc) btnCalc.addEventListener('click', calculateGoal);
});

function calculateGoal() {
    if (!appState.currentSubject) return;

    const grades = appState.grades[appState.currentSubject];
    const targetGradeStr = document.getElementById('target-grade-select').value;
    const thresholds = getThresholds();
    const targetPercent = thresholds[targetGradeStr];
    const bestN = grades.bestN || 'all';

    const currentClassAvg = grades.classTestAverage;

    // Tests taken / remaining
    const filledCTs = grades.classTests
        .map(g => parseFloat(g))
        .filter(n => !isNaN(n));
    const testsTaken = filledCTs.length;
    const testsRemaining = 8 - testsTaken;

    // Header
    let html = `<h4 style="margin-bottom: 6px; color: var(--text-primary);">Target: Grade ${targetGradeStr} (${targetPercent}%)</h4>`;
    html += `<p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 4px;">Current class-test average: <strong>${currentClassAvg}%</strong></p>`;
    if (bestN !== 'all') {
        html += `<p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;"><i class="fas fa-filter"></i> Counting your <strong>best ${bestN}</strong> of 8 class tests.</p>`;
    } else {
        html += `<p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 12px;"><i class="fas fa-filter"></i> Counting <strong>all</strong> entered class tests.</p>`;
    }

    html += '<div class="goal-scenarios">';

    // --- Scenario A: Boost via semester test only ---
    // Final = ClassAvg * 0.6 + Semester * 0.4  =>  Semester = (Target - ClassAvg*0.6) / 0.4
    const requiredSemester = (targetPercent - currentClassAvg * 0.6) / 0.4;
    if (requiredSemester <= 0) {
        html += `
            <div class="goal-scenario scenario-achieved">
                <h5><i class="fas fa-check-circle"></i> A. Semester test pressure</h5>
                <p>You're already at the target with your class average alone. Even a 0% on the semester test would keep you in range.</p>
            </div>`;
    } else if (requiredSemester > 100) {
        html += `
            <div class="goal-scenario scenario-impossible">
                <h5><i class="fas fa-times-circle"></i> A. Semester test alone won't do it</h5>
                <p>You'd need <strong>${Math.round(requiredSemester)}%</strong> on the semester test (impossible — capped at 100%). Improve your class-test average first.</p>
            </div>`;
    } else {
        html += `
            <div class="goal-scenario">
                <h5><i class="fas fa-clipboard-check"></i> A. Semester test only</h5>
                <p>If your class average stays at <strong>${currentClassAvg}%</strong>, you need <strong>${Math.round(requiredSemester)}%</strong> on the semester test.</p>
            </div>`;
    }

    // --- Scenario B: Improve class-test average via remaining tests ---
    if (testsRemaining > 0) {
        // Compute the maximum class-test average reachable by scoring 100 on every remaining test,
        // honoring the best-N rule.
        const allMax = [...filledCTs, ...Array(testsRemaining).fill(100)];
        const maxClassAvg = avgTopN(allMax, bestN);

        // What class average would be required so that even 100% semester just reaches target?
        // Target = ClassAvg*0.6 + 100*0.4  =>  ClassAvg = (Target - 40) / 0.6
        const minClassAvgWithFullSemester = (targetPercent - 40) / 0.6;
        // And what class average is required if we don't take semester into account (pure CT path)?
        const classAvgNoSemester = targetPercent;

        if (maxClassAvg < minClassAvgWithFullSemester) {
            html += `
                <div class="goal-scenario scenario-impossible">
                    <h5><i class="fas fa-times-circle"></i> B. Even 100% on every remaining test isn't enough</h5>
                    <p>Best possible class-test average from here: <strong>${round1(maxClassAvg)}%</strong>. Combined with 100% semester, your final caps at <strong>${round1(maxClassAvg * 0.6 + 40)}%</strong> — short of the ${targetPercent}% target.</p>
                </div>`;
        } else {
            // Find minimum equal score X on every remaining test so the (best-N) class avg hits the required threshold
            // Required class-test average we should hit (paired with required semester):
            const requiredClassAvg = minClassAvgWithFullSemester; // pessimistic anchor — semester at 100%
            const requiredEqualScore = solveEqualRemainingScore(filledCTs, testsRemaining, bestN, requiredClassAvg);

            let copy;
            if (requiredEqualScore == null) {
                copy = `You already have enough class-test points — any reasonable scores on the remaining ${testsRemaining} test${testsRemaining === 1 ? '' : 's'} keep this in play.`;
            } else if (requiredEqualScore > 100) {
                copy = `You'd need higher than 100% on each remaining test under this scenario — not achievable, so push the semester score instead (Scenario A).`;
            } else {
                copy = `Score at least <strong>${Math.round(requiredEqualScore)}%</strong> on each of the <strong>${testsRemaining}</strong> remaining class test${testsRemaining === 1 ? '' : 's'} (assuming 100% semester) — or higher to give yourself semester margin.`;
            }

            html += `
                <div class="goal-scenario">
                    <h5><i class="fas fa-arrow-trend-up"></i> B. Lift your class-test average</h5>
                    <p>${copy}</p>
                    <p style="color: var(--text-secondary); font-size: 0.85rem;">Max reachable class-test average: <strong>${round1(maxClassAvg)}%</strong>.</p>
                </div>`;
        }
    } else {
        html += `
            <div class="goal-scenario">
                <h5><i class="fas fa-ban"></i> B. No class tests remaining</h5>
                <p>All 8 class tests are already entered — the semester test is your only remaining lever.</p>
            </div>`;
    }

    // --- Scenario C: Combination — assume an 80% semester, what do CTs need? ---
    if (testsRemaining > 0) {
        const assumedSemester = 80;
        const requiredClassAvgC = (targetPercent - assumedSemester * 0.4) / 0.6;
        const requiredEqualScoreC = solveEqualRemainingScore(filledCTs, testsRemaining, bestN, requiredClassAvgC);

        let copy;
        if (requiredClassAvgC <= currentClassAvg) {
            copy = `You're already at ${currentClassAvg}% class average — with a typical <strong>80%</strong> semester score, you're at or above the target.`;
        } else if (requiredEqualScoreC == null) {
            copy = `Any reasonable scores on the remaining tests work if you can hit <strong>80%</strong> on the semester.`;
        } else if (requiredEqualScoreC > 100) {
            copy = `Even with an 80% semester, you'd need impossible scores on remaining CTs. Aim higher on the semester (Scenario A).`;
        } else {
            copy = `Assume an <strong>80%</strong> semester score, then aim for <strong>${Math.round(requiredEqualScoreC)}%</strong> on each remaining class test — a balanced path.`;
        }

        html += `
            <div class="goal-scenario">
                <h5><i class="fas fa-balance-scale"></i> C. Balanced (80% semester assumption)</h5>
                <p>${copy}</p>
            </div>`;
    }

    html += '</div>';

    const resultsDiv = document.getElementById('goal-results');
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
}

function round1(n) { return Math.round(n * 10) / 10; }

// Average top-N of an array of numbers (parseFloat-ed); bestN can be 'all' or a positive integer.
function avgTopN(nums, bestN) {
    if (nums.length === 0) return 0;
    let arr = nums;
    if (bestN !== 'all') {
        const n = parseInt(bestN);
        if (!isNaN(n) && n > 0 && n < nums.length) {
            arr = [...nums].sort((a, b) => b - a).slice(0, n);
        }
    }
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

// Find the minimum equal score X (0..100) to put on every remaining test so that the
// best-N average of (existing CTs + remaining filled with X) >= requiredAvg.
// Returns null if already satisfied at X = 0, or > 100 if impossible.
function solveEqualRemainingScore(existingCTs, remainingCount, bestN, requiredAvg) {
    if (avgTopN([...existingCTs, ...Array(remainingCount).fill(0)], bestN) >= requiredAvg) return null;

    // Binary search on X
    let lo = 0, hi = 100;
    // First check if even X=100 fails
    if (avgTopN([...existingCTs, ...Array(remainingCount).fill(100)], bestN) < requiredAvg) {
        return Infinity; // signals "impossible"
    }
    for (let iter = 0; iter < 40; iter++) {
        const mid = (lo + hi) / 2;
        const test = avgTopN([...existingCTs, ...Array(remainingCount).fill(mid)], bestN);
        if (test >= requiredAvg) hi = mid; else lo = mid;
    }
    return hi;
}