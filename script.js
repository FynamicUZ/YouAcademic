// Subject Configurations per Grade
const GRADE_SUBJECTS = {
    '5': ['science', 'art', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'music', 'literature', 'ce', 'pe'],
    '6': ['science', 'art', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'music', 'literature', 'ce', 'pe'],
    '7': ['science', 'art', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'music', 'literature', 'ce', 'pe', 'geography'],
    '8': ['chemistry', 'biology', 'physics', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'literature', 'ce', 'pe', 'geography'],
    '9': ['chemistry', 'biology', 'physics', 'cs', 'english', 'math', 'russian', 'gp', 'uzbek', 'history', 'literature', 'ce', 'pe'],
    '10': ['english', 'russian', 'gp', 'math', 'uzbek', 'history', 'pe', 'literature', 'ce', 'mp'] // Plus electives (OA + OB)
};

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
    'chemistry': { name: 'Chemistry', icon: 'fa-vial' },
    'biology': { name: 'Biology', icon: 'fa-dna' },
    'physics': { name: 'Physics', icon: 'fa-atom' },
    'economics': { name: 'Economics', icon: 'fa-chart-line' },
    'computing': { name: 'Computing', icon: 'fa-desktop' },
    'mp': { name: 'MP', icon: 'fa-users' }, // Assuming MP logic if needed later
    'ob': { name: 'OB', icon: 'fa-microscope' },
    'oa': { name: 'OA', icon: 'fa-flask' }
};

// Main Application State
const appState = {
    currentView: 'dashboard',
    currentSubject: null,
    studentName: '', // Empty by default
    grade: '',       // New field
    electiveOB: '',  // For Grade 10 OB
    electiveOA: '',  // For Grade 10 OA
    sortMode: 'percentage',
    colorFilter: 'all',
    subjects: [], // Will be populated based on grade
    grades: {}
};

// Grading Thresholds
const GRADING_THRESHOLDS = {
    'default': { '5': 85, '4': 75, '3': 60 },
    'special': { '5': 80, '4': 70, '3': 54 } // For Grades 5, 6, 7
};

function getThresholds() {
    if (['5', '6', '7'].includes(appState.grade)) {
        return GRADING_THRESHOLDS.special;
    }
    return GRADING_THRESHOLDS.default;
}

// Initialize from localStorage
function initializeApp() {
    // Load student info
    const savedStudentInfo = localStorage.getItem('academicStudentInfo');
    if (savedStudentInfo) {
        const studentInfo = JSON.parse(savedStudentInfo);
        appState.studentName = studentInfo.name || '';
        appState.grade = studentInfo.grade || '';
        appState.electiveOB = studentInfo.electiveOB || '';
        appState.electiveOA = studentInfo.electiveOA || '';
    }

    // Load subjects
    const savedSubjects = localStorage.getItem('academicSubjects');
    if (savedSubjects) {
        appState.subjects = JSON.parse(savedSubjects);
    }

    // If no subjects (fresh load or reset), and we have a grade, populate them
    if (appState.subjects.length === 0 && appState.grade) {
        updateSubjectsForGrade(appState.grade, appState.electiveOB, appState.electiveOA);
    }

    // Load grades
    const savedGrades = localStorage.getItem('academicGrades');
    if (savedGrades) {
        appState.grades = JSON.parse(savedGrades);
    }

    // Migration: backfill bestN for older saved data
    Object.keys(appState.grades).forEach(id => {
        if (appState.grades[id].bestN === undefined) {
            appState.grades[id].bestN = 'all';
        }
    });

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
        if (appState.grade === '10') {
            document.getElementById('grade-10-options').style.display = 'block';
            setSelectValue(document.getElementById('elective-ob-input'), appState.electiveOB);
            setSelectValue(document.getElementById('elective-oa-input'), appState.electiveOA);
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

    if (grade === '10') {
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

// Save all data to localStorage
function saveAllData() {
    localStorage.setItem('academicGrades', JSON.stringify(appState.grades));
    localStorage.setItem('academicSubjects', JSON.stringify(appState.subjects));
    localStorage.setItem('academicStudentInfo', JSON.stringify({
        name: appState.studentName,
        grade: appState.grade,
        electiveOB: appState.electiveOB,
        electiveOA: appState.electiveOA
    }));
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

// Determine final grade
function getFinalGrade(percentage) {
    const thresholds = getThresholds();
    if (percentage >= thresholds['5']) return '5';
    if (percentage >= thresholds['4']) return '4';
    if (percentage >= thresholds['3']) return '3';
    if (percentage > 0) return '2';
    return '-';
}

// Get grade color class
function getGradeColorClass(value) {
    const thresholds = getThresholds();
    if (value >= thresholds['5']) return 'grade-excellent';
    if (value >= thresholds['4']) return 'grade-good';
    if (value >= thresholds['3']) return 'grade-average';
    return 'grade-poor';
}

// Get color for value
function getGradeColor(value) {
    const thresholds = getThresholds();
    if (value >= thresholds['5']) return '#10b981';
    if (value >= thresholds['4']) return '#a3e635';
    if (value >= thresholds['3']) return '#f59e0b';
    return '#ef4444';
}

// Get filter category for value
function getGradeFilterCategory(value) {
    const thresholds = getThresholds();
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

// Switch to subject view
function switchToSubject(subjectId) {
    appState.currentSubject = subjectId;
    appState.currentView = 'subject';

    // Update UI
    document.getElementById('dashboard-view').classList.remove('active-view');
    document.getElementById('subject-view').classList.add('active-view');
    document.getElementById('btn-dashboard').classList.remove('active');

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
    appState.currentView = 'dashboard';
    appState.currentSubject = null;

    document.getElementById('dashboard-view').classList.add('active-view');
    document.getElementById('subject-view').classList.remove('active-view');
    document.getElementById('btn-dashboard').classList.add('active');

    document.querySelectorAll('.subject-item').forEach(item => {
        item.classList.remove('active');
    });

    renderDashboard();
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

// Export data as CSV
function exportData() {
    // Create CSV content
    let csvContent = "Subject,Class Test 1,Class Test 2,Class Test 3,Class Test 4,Class Test 5,Class Test 6,Class Test 7,Class Test 8,Best N,Class Test Average,Semester Test,Final Percentage,Final Grade\n";

    // Add data for each subject
    appState.subjects.forEach(subject => {
        const grades = appState.grades[subject.id] || {
            classTests: Array(8).fill(''),
            classTestAverage: 0,
            semesterTest: '',
            bestN: 'all',
            finalPercentage: 0,
            finalGrade: '-'
        };

        const row = [
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

    // Add summary
    csvContent += '\n\nSUMMARY STATISTICS\n';
    csvContent += `Student Name,${appState.studentName}\n`;
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

// Parse the CSV text produced by exportData (best-effort, tolerant)
function parseCsvImport(text) {
    const lines = text.split(/\r?\n/);
    if (lines.length < 2) throw new Error('File is empty or has no data rows');

    const header = parseCsvRow(lines[0]);
    if (!header[0] || header[0].toLowerCase() !== 'subject') {
        throw new Error('Header does not look like an exported grades CSV');
    }

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const raw = lines[i];
        if (!raw.trim()) continue;
        // Stop at the SUMMARY STATISTICS block — its first cell is the label, not a subject name
        if (/^summary statistics/i.test(raw)) break;

        const f = parseCsvRow(raw);
        const name = (f[0] || '').trim();
        if (!name) continue;

        // Subject rows have at least 10 columns (subject + 8 CTs + something else)
        if (f.length < 10) continue;

        // Pre-best-N exports had no Best N column → 13 cols total; new exports → 14 cols.
        // Detect by checking whether column 9 looks like a bestN value ('all' or 1-8).
        const col9 = (f[9] || '').toLowerCase();
        const hasBestN = col9 === 'all' || /^[1-8]$/.test(col9);

        const classTests = [];
        for (let k = 1; k <= 8; k++) classTests.push(f[k] || '');

        const bestN = hasBestN ? (col9 === 'all' ? 'all' : Number(col9)) : 'all';
        const semesterIdx = hasBestN ? 11 : 10;
        const semesterTest = f[semesterIdx] || '';

        rows.push({ name, classTests, bestN, semesterTest });
    }
    return { rows };
}

// Apply parsed CSV rows into appState: update matching subjects, create new ones for unknowns
function applyCsvImport(rows) {
    let updated = 0;
    let created = 0;
    rows.forEach((row, i) => {
        let subject = appState.subjects.find(s => s.name.toLowerCase() === row.name.toLowerCase());
        if (!subject) {
            subject = {
                id: row.name.toLowerCase().replace(/\s+/g, '-') + '-' + (Date.now() + i),
                name: row.name,
                icon: 'fa-book'
            };
            appState.subjects.push(subject);
            created++;
        } else {
            updated++;
        }
        appState.grades[subject.id] = {
            classTests: row.classTests.slice(0, 8),
            semesterTest: row.semesterTest,
            bestN: row.bestN,
            classTestAverage: 0,
            finalPercentage: 0,
            finalGrade: '-'
        };
        recalculateSubject(subject.id);
    });

    saveAllData();
    renderSidebar();
    renderDashboard();
    if (appState.currentSubject) renderSubjectView(appState.currentSubject);

    showToast(`Imported ${rows.length} subject${rows.length === 1 ? '' : 's'} (${created} new, ${updated} updated)`);
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
function resetAllData(removeCustomSubjects = false, deleteProfile = false) {
    if (deleteProfile) {
        localStorage.removeItem('academicStudentInfo');
        localStorage.removeItem('academicSubjects');
        localStorage.removeItem('academicGrades');
        location.reload();
        return;
    }

    // Reset grades
    appState.subjects.forEach(subject => {
        appState.grades[subject.id] = {
            classTests: Array(8).fill(''),
            semesterTest: '',
            bestN: 'all',
            classTestAverage: 0,
            finalPercentage: 0,
            finalGrade: '-'
        };
    });

    // Remove custom subjects if requested
    if (removeCustomSubjects) {
        // Keep only default subjects
        const defaultSubjectIds = ['english', 'russian', 'uzbek', 'cs', 'chemistry', 'biology',
            'physics', 'math', 'uzbek-lit', 'history', 'geography', 'pe', 'ce', 'gp'];
        appState.subjects = appState.subjects.filter(subject =>
            defaultSubjectIds.includes(subject.id)
        );
    }

    saveAllData();

    // Update UI
    if (appState.currentSubject) {
        renderSubjectView(appState.currentSubject);
    }

    renderDashboard();
    renderSidebar();
    showToast('All data has been reset.', 'info');
}

// Show reset confirmation modal
function showResetModal() {
    const modal = document.getElementById('reset-modal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reset checkbox state
    document.getElementById('reset-subjects').checked = false;
    document.getElementById('reset-profile-data').checked = false;
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

    // Handle Grade 10 logic
    const grade10Options = document.getElementById('grade-10-options');
    if (appState.grade === '10') {
        grade10Options.style.display = 'block';
        setSelectValue(document.getElementById('elective-ob-input'), appState.electiveOB);
        setSelectValue(document.getElementById('elective-oa-input'), appState.electiveOA);
    } else {
        grade10Options.style.display = 'none';
        setSelectValue(document.getElementById('elective-ob-input'), '');
        setSelectValue(document.getElementById('elective-oa-input'), '');
    }

    // Reset new subject form
    document.getElementById('new-subject-name').value = '';
    document.querySelectorAll('.icon-option').forEach(icon => {
        icon.classList.remove('active');
    });

    // Populate manage subjects list
    const manageList = document.getElementById('manage-subjects-list');
    manageList.innerHTML = '';

    appState.subjects.forEach((subject, index) => {
        const isDefault = ['english', 'russian', 'uzbek', 'cs', 'chemistry', 'biology',
            'physics', 'math', 'uzbek-lit', 'history', 'geography', 'pe', 'ce', 'gp',
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
    document.getElementById('btn-back').addEventListener('click', switchToDashboard);
    document.getElementById('btn-export').addEventListener('click', exportData);
    document.getElementById('btn-reset').addEventListener('click', showResetModal);
    document.getElementById('btn-profile').addEventListener('click', showProfileModal);
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    document.getElementById('btn-add-subject').addEventListener('click', showProfileModal);

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
        resetAllData(removeCustomSubjects, deleteProfile);
        closeAllModals();
    });

    // CSV import — uses local showConfirmModal so wired inside initApp
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
                showConfirmModal(
                    `Import ${result.rows.length} subject(s) from CSV? This will overwrite grades for any matching subjects.`,
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

    // Custom Confirm Modal
    function showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('custom-confirm-modal');
        const messageEl = document.getElementById('confirm-message');
        const confirmBtn = document.getElementById('btn-modal-confirm');
        const cancelBtn = document.getElementById('btn-modal-cancel');

        messageEl.textContent = message;
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
        });
    }

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

        if (newGrade === '10' && (!newOB || !newOA)) {
            showToast('Please select both OB and OA subjects for Grade 10', 'error');
            return;
        }

        // Check if grade or electives changed
        const gradeChanged = newGrade !== appState.grade;
        const obChanged = newOB !== appState.electiveOB;
        const oaChanged = newOA !== appState.electiveOA;

        const proceedWithSave = () => {
            if (gradeChanged || (newGrade === '10' && (obChanged || oaChanged))) {
                updateSubjectsForGrade(newGrade, newOB, newOA);
                // Force immediate reload of subject list in view
                appState.subjects = JSON.parse(localStorage.getItem('academicSubjects'));
            }

            appState.studentName = newName;
            appState.grade = newGrade;
            appState.electiveOB = newOB;
            appState.electiveOA = newOA;

            saveAllData();

            // Immediate UI Update
            renderSidebar();
            renderDashboard();
            updateDashboardStats();

            // Remove mandatory status if set
            const modal = document.getElementById('profile-modal');
            modal.classList.remove('mandatory');
            document.querySelector('.close-modal').style.display = 'block';

            closeAllModals();
            showToast('Profile updated successfully!');
        };

        if (gradeChanged || (newGrade === '10' && (obChanged || oaChanged))) {
            showConfirmModal('Changing grade/subjects will reset your subjects. Continue?', proceedWithSave);
        } else {
            proceedWithSave();
        }
    });

    // Grade selection change
    document.getElementById('student-grade-input').addEventListener('change', function () {
        const grade10Options = document.getElementById('grade-10-options');
        if (this.value === '10') {
            grade10Options.style.display = 'block';
        } else {
            grade10Options.style.display = 'none';
        }
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

    // Show welcome message
    setTimeout(() => {
        showToast('Welcome to Academic Dashboard! Start by entering your grades.');
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