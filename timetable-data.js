// Weekly timetables transcribed from the school's printed aSc sheets
// (Составлено 01/09/2026), one per grade per stream.
//
// Cell shape: [subjectKey, room, teacher] — or null for a free slot.
// `subjectKey` is a SUBJECT_DETAILS key so the timetable shares icons and names
// with the rest of the app. Two labels have no graded subject behind them and
// are resolved from TIMETABLE_EXTRAS instead: 'ks' (kurator soati / homeroom)
// and 't5b' (the joint Art + Technology period the Grade 5 sheets run).
//
// Grades 10-11 print their elective blocks as one cell listing every option
// ("Chem,Phys,CS"). Those are stored as '@ob' / '@oa' and resolved at render
// time to whichever subject the student actually picked, so two students in the
// same class each see their own lesson. The blocks are always double periods.
//
// Rooms left as '' are ones the printed sheet cut off behind the teacher name.

const LESSON_TIMES = [
    { n: 1, start: '8:30',  end: '9:15'  },
    { n: 2, start: '9:20',  end: '10:05' },
    { n: 3, start: '10:10', end: '10:55' },
    { n: 4, start: '11:25', end: '12:10' },
    { n: 5, start: '12:15', end: '13:00' },
    { n: 6, start: '14:00', end: '14:45' },
    { n: 7, start: '14:50', end: '15:35' },
    { n: 8, start: '15:40', end: '16:25' }
];

// Longer gaps the sheet builds in, keyed by the lesson they follow
const LESSON_BREAKS = { 3: 'Break · 10:55 – 11:25', 5: 'Lunch · 13:00 – 14:00' };

// Timetable-only labels with no entry in SUBJECT_DETAILS
const TIMETABLE_EXTRAS = {
    'ks': { name: 'Homeroom', icon: 'fa-user-friends' },
    't5b': { name: 'Art / Technology', icon: 'fa-palette' }
};

const WEEKDAYS = [
    { key: 'mon', label: 'Monday',    short: 'Mon' },
    { key: 'tue', label: 'Tuesday',   short: 'Tue' },
    { key: 'wed', label: 'Wednesday', short: 'Wed' },
    { key: 'thu', label: 'Thursday',  short: 'Thu' },
    { key: 'fri', label: 'Friday',    short: 'Fri' }
];

const STREAMS = [
    { key: 'blue',  label: 'Blue' },
    { key: 'green', label: 'Green' }
];

const TIMETABLES = {
    '5': {
        blue: {
            mon: [['ks','206','Ms. Xurshida'],['english','107','Ms. Haydee / Mr. Kamoliddin'],['t5b','205',"Mr. G'olib / Ms. Nafisa"],['cs','103','Mr. Ravshan'],['history','204','Mr. Baxtiyor'],['math','108','Ms. Shahnoza'],['uzbek','206','Ms. Xurshida']],
            tue: [['russian','108','Mr. Azamat'],['english','107','Ms. Haydee / Mr. Kamoliddin'],['math','102','Ms. Shahnoza'],['cs','103','Mr. Ravshan'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid'],['ce','105','Mr. Bobur']],
            wed: [['math','101','Ms. Shahnoza'],['gp','109','Mr. Amir / Mr. Asadbek'],['history','206','Mr. Baxtiyor'],['uzbek','206','Ms. Xurshida'],['russian','108','Mr. Azamat'],['english','107','Ms. Haydee / Mr. Kamoliddin']],
            thu: [['english','107','Ms. Haydee / Mr. Kamoliddin'],['uzbek','206','Ms. Xurshida'],['science','205',"Mr. Ulug'bek / Ms. LI"],['math','102','Ms. Shahnoza'],['literature','206','Ms. Xurshida'],['english','107','Ms. Haydee / Mr. Kamoliddin']],
            fri: [['music','105',"Mr. Uyg'un"],['math','102','Ms. Shahnoza'],['science','205',"Mr. Ulug'bek / Ms. LI"],['science','205',"Mr. Ulug'bek / Ms. LI"],['literature','206','Ms. Xurshida']]
        },
        green: {
            mon: [['ks','','Mr. Ravshan'],['t5b','205',"Mr. G'olib / Ms. Nafisa"],['math','102','Ms. Shahnoza'],['literature','206','Mr. Ulugbek T'],['history','105',"Mr. To'lqin"],['english','107','Mr. Kamoliddin / Ms. Haydee'],['uzbek','107','Mr. Ulugbek T']],
            tue: [['math','102','Ms. Shahnoza'],['history','108',"Mr. To'lqin"],['cs','103','Mr. Ravshan'],['english','107','Mr. Kamoliddin / Ms. Haydee'],['literature','105','Mr. Ulugbek T'],['science','205','Ms. LI'],['uzbek','204','Mr. Ulugbek T']],
            wed: [['gp','109','Mr. Amir / Mr. Asadbek'],['science','205','Ms. LI'],['math','102','Ms. Shahnoza'],['cs','103','Mr. Ravshan'],['english','107','Mr. Kamoliddin / Ms. Haydee'],['russian','108','Mr. Azamat']],
            thu: [['uzbek','102','Mr. Ulugbek T'],['science','205','Ms. LI'],['english','107','Mr. Kamoliddin / Ms. Haydee'],['russian','108','Mr. Azamat'],['math','102','Ms. Shahnoza'],['math','102','Ms. Shahnoza']],
            fri: [['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid'],['english','107','Mr. Kamoliddin / Ms. Haydee'],['ce','107','Mr. Bobur'],['music','105',"Mr. Uyg'un"]]
        }
    },
    '6': {
        blue: {
            mon: [['ks','101','Mr. Anvar'],['cs','103','Mr. Ravshan'],['literature','206','Ms. Xurshida'],['history','108','Mr. Baxtiyor'],['uzbek','206','Ms. Xurshida'],['math','205','Mr. Sirojiddin'],['ce','105','Mr. Bobur']],
            tue: [['english','106','Ms. Haydee / Ms. Gulnoza'],['math','101','Mr. Sirojiddin'],['russian','108','Ms. Sarvinoz'],['uzbek','206','Ms. Xurshida'],['art','205',"Mr. G'olib"],['english','106','Ms. Haydee / Ms. Gulnoza'],['literature','206','Ms. Xurshida']],
            wed: [['science','205','Ms. LI'],['math','102','Mr. Sirojiddin'],['gp','109','Mr. Asadbek / Mr. Amir'],['history','204','Mr. Baxtiyor'],['cs','103','Mr. Ravshan'],['science','205','Ms. LI']],
            thu: [['russian','105','Ms. Sarvinoz'],['english','106','Ms. Haydee / Ms. Gulnoza'],['gp','109','Mr. Asadbek / Mr. Amir'],['math','204','Mr. Sirojiddin'],['science','205','Ms. LI'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid']],
            fri: [['technology','205','Ms. Nafisa'],['math','109','Mr. Sirojiddin'],['uzbek','206','Ms. Xurshida'],['english','106','Ms. Haydee / Ms. Gulnoza'],['science','205','Ms. LI'],['music','105',"Mr. Uyg'un"]]
        },
        green: {
            mon: [['ks','205',"Mr. G'olib"],['math','101','Mr. Sirojiddin'],['uzbek','204','Mr. Ulugbek T'],['history','105',"Mr. To'lqin"],['english','106','Ms. Haydee / Ms. Gulnoza'],['gp','109','Mr. Amir / Mr. Asadbek'],['science','204','Ms. LI']],
            tue: [['russian','107','Ms. Sarvinoz'],['art','205',"Mr. G'olib"],['english','106','Ms. Haydee / Ms. Gulnoza'],['literature','105','Mr. Ulugbek T'],['math','101','Mr. Sirojiddin'],['uzbek','102','Mr. Ulugbek T'],['science','205','Ms. LI']],
            wed: [['english','107','Ms. Haydee / Ms. Gulnoza'],['cs','103','Mr. Ravshan'],['math','103','Mr. Sirojiddin'],['gp','109','Mr. Amir / Mr. Asadbek'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid']],
            thu: [['cs','103','Mr. Ravshan'],['russian','109','Ms. Sarvinoz'],['literature','108','Mr. Ulugbek T'],['history','109',"Mr. To'lqin"],['math','109','Mr. Sirojiddin'],['uzbek','206','Mr. Ulugbek T'],['science','205','Ms. LI']],
            fri: [['english','106','Ms. Haydee / Ms. Gulnoza'],['technology','205','Ms. Nafisa'],['music','105',"Mr. Uyg'un"],['math','102','Mr. Sirojiddin'],['ce','204','Mr. Bobur'],['science','205','Ms. LI']]
        }
    },
    '7': {
        blue: {
            mon: [['ks','109','Mr. Bobur'],['geography','109','Mr. Ruslan A'],['science','203',"Mr. Ulug'bek / Ms. LI"],['science','205',"Mr. Ulug'bek / Ms. LI"],['math','102','Mr. Sirojiddin'],['uzbek','206','Ms. Xurshida'],['drafting','205',"Mr. G'olib"],['literature','206','Ms. Xurshida']],
            tue: [['math','205','Mr. Sirojiddin'],['russian','109','Ms. Sarvinoz'],['english','107','Mr. Kamoliddin'],['history','102','Mr. Baxtiyor'],['gp','109','Mr. Asadbek / Mr. Amir'],['english','107','Mr. Kamoliddin'],['history','102','Mr. Baxtiyor']],
            wed: [['math','103','Mr. Sirojiddin'],['uzbek','206','Ms. Xurshida'],['science','205',"Mr. Ulug'bek / Ms. LI"],['science','205',"Mr. Ulug'bek / Ms. LI"],['literature','206','Ms. Xurshida'],['ce','109','Mr. Bobur']],
            thu: [['math','205','Mr. Sirojiddin'],['cs','103','Mr. Ravshan'],['russian','106','Ms. Sarvinoz'],['english','107','Mr. Kamoliddin'],['history','106','Mr. Baxtiyor'],['cs','103','Mr. Ravshan'],['uzbek','206','Ms. Xurshida']],
            fri: [['gp','109','Mr. Asadbek / Mr. Amir'],['music','105',"Mr. Uyg'un"],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid'],['math','108','Mr. Sirojiddin'],['english','107','Mr. Kamoliddin']]
        },
        green: {
            mon: [['ks','108','Mr. Baxtiyor'],['history','206',"Mr. To'lqin"],['english','107','Ms. Haydee / Mr. Kamoliddin'],['math','102','Mr. James / Ms. Shahnoza'],['geography','205','Mr. Ruslan A'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid'],['drafting','205',"Mr. G'olib"]],
            tue: [['cs','103','Mr. Ravshan'],['uzbek','204','Mr. Ruslan'],['science','205',"Mr. Ulug'bek / Ms. LI"],['science','205',"Mr. Ulug'bek / Ms. LI"],['math','102','Mr. James / Ms. Shahnoza'],['russian','108','Mr. Azamat'],['gp','109','Mr. Amir / Mr. Asadbek']],
            wed: [['uzbek','204','Mr. Ruslan'],['english','107','Ms. Haydee / Mr. Kamoliddin'],['history','107',"Mr. To'lqin"],['math','101','Mr. James / Ms. Shahnoza'],['science','205',"Mr. Ulug'bek / Ms. LI"],['math','101','Mr. James / Ms. Shahnoza'],['english','107','Ms. Haydee / Mr. Kamoliddin']],
            thu: [['ce','206','Mr. Bobur'],['russian','108','Mr. Azamat'],['history','206',"Mr. To'lqin"],['science','205',"Mr. Ulug'bek / Ms. LI"],['literature','204','Mr. Ruslan'],['uzbek','204','Mr. Ruslan'],['gp','109','Mr. Amir / Mr. Asadbek']],
            fri: [['literature','204','Mr. Ruslan'],['english','107','Ms. Haydee / Mr. Kamoliddin'],['cs','103','Mr. Ravshan'],['music','105',"Mr. Uyg'un"],['math','102','Mr. James / Ms. Shahnoza']]
        }
    },
    '8': {
        blue: {
            mon: [['ks','106','Ms. Shahnoza'],['english','106','Ms. Gulnoza'],['gp','109','Mr. Amir / Mr. Asadbek'],['geography','201','Mr. Ruslan A'],['physics','201','Mr. Otabek'],['biology','202','Mr. George'],['math','','Mr. Asror / Mr. James']],
            tue: [['physics','201','Mr. Otabek'],['cs','103','Mr. Ravshan'],['biology','202','Mr. George'],['english','106','Ms. Gulnoza'],['english','106','Ms. Gulnoza'],['law','105','Mr. Bobur'],['chemistry','203','Ms. Anna / Mr. Shahzod'],['russian','108','Mr. Azamat']],
            wed: [['history','106','Mr. Baxtiyor'],['math','','Mr. Asror / Mr. James'],['cs','104','Mr. Ravshan'],['english','107','Ms. Gulnoza'],['history','106','Mr. Baxtiyor'],['literature','204','Mr. Ruslan'],['ce','204','Mr. Bobur']],
            thu: [['uzbek','204','Mr. Ruslan'],['math','','Mr. Asror / Mr. James'],['physics','201','Mr. Otabek'],['chemistry','203','Ms. Anna / Mr. Shahzod'],['chemistry','203','Ms. Anna / Mr. Shahzod'],['russian','108','Mr. Azamat'],['cs','103','Mr. Ravshan']],
            fri: [['biology','202','Mr. George'],['history','106','Mr. Baxtiyor'],['uzbek','204','Mr. Ruslan'],['math','','Mr. Asror / Mr. James'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid']]
        },
        green: {
            mon: [['ks','204','Mr. Ruslan'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['geography','105','Mr. Ruslan A'],['gp','109','Mr. Amir / Mr. Asadbek'],['math','','Mr. Asror / Mr. James'],['english','106','Ms. Gulnoza'],['history','106',"Mr. To'lqin"],['biology','202','Mr. George']],
            tue: [['history','105',"Mr. To'lqin"],['english','106','Ms. Gulnoza'],['uzbek','204','Mr. Ruslan'],['physics','201','Mr. Otabek'],['cs','103','Mr. Ravshan'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['russian','108','Mr. Azamat']],
            wed: [['russian','108','Mr. Azamat'],['history','106',"Mr. To'lqin"],['biology','202','Mr. George'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['uzbek','204','Mr. Ruslan'],['cs','103','Mr. Ravshan'],['english','106','Ms. Gulnoza']],
            thu: [['math','','Mr. Asror / Mr. James'],['literature','204','Mr. Ruslan'],['cs','103','Mr. Ravshan'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid'],['ce','106','Mr. Bobur'],['law','106','Mr. Bobur']],
            fri: [['math','','Mr. Asror / Mr. James'],['biology','202','Mr. George'],['english','106','Ms. Gulnoza'],['physics','201','Mr. Otabek'],['physics','201','Mr. Otabek'],['math','','Mr. Asror / Mr. James']]
        }
    },
    '9': {
        blue: {
            mon: [['ks','202','Mr. Muhammad'],['math','102','Mr. James / Mr. Anvar'],['cs','103','Mr. Ravshan'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['literature','107','Mr. Ulugbek T'],['geography','105','Mr. Ruslan A'],['english','109','Mr. Asadbek'],['physics','201','Mr. Rejo / Mr. Otabek']],
            tue: [['law','109','Mr. Bobur'],['physics','201','Mr. Rejo / Mr. Otabek'],['uzbek','206','Mr. Ulugbek T'],['biology','202','Mr. George / Mr. Muhammad'],['russian','108','Mr. Azamat'],['math','','Mr. James / Mr. Anvar'],['biology','202','Mr. George / Mr. Muhammad']],
            wed: [['math','102','Mr. James / Mr. Anvar'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['physics','201','Mr. Rejo / Mr. Otabek'],['ce','105','Mr. Bobur'],['economics','109','Mr. Abror / Mr. Amir'],['biology','202','Mr. George / Mr. Muhammad'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid']],
            thu: [['english','106','Mr. Asadbek'],['history','105','Mr. Baxtiyor'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['cs','103','Mr. Ravshan'],['uzbek','107','Mr. Ulugbek T'],['english','109','Mr. Asadbek'],['math','','Mr. James / Mr. Anvar']],
            fri: [['history','206','Mr. Baxtiyor'],['gp','108','Mr. Amir'],['history','108','Mr. Baxtiyor'],['russian','108','Mr. Azamat'],['cs','103','Mr. Ravshan']]
        },
        green: {
            mon: [['ks','105','Mr. Obid'],['russian','108','Mr. Azamat'],['history','108',"Mr. To'lqin"],['english','106','Ms. Haydee / Ms. Gulnoza'],['cs','103','Mr. Ravshan'],['math','102','Mr. James / Mr. Anvar'],['biology','202','Mr. George']],
            tue: [['biology','202','Mr. George'],['math','102','Mr. James / Mr. Anvar'],['physics','201','Mr. Rejo / Mr. Otabek'],['literature','204','Mr. Ruslan'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['gp','109','Mr. Amir'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid']],
            wed: [['history','105',"Mr. To'lqin"],['uzbek','204','Mr. Ruslan'],['ce','105','Mr. Bobur'],['history','106',"Mr. To'lqin"],['economics','109','Mr. Abror / Mr. Amir'],['physics','201','Mr. Rejo / Mr. Otabek'],['cs','103','Mr. Ravshan']],
            thu: [['russian','108','Mr. Azamat'],['law','107','Mr. Bobur'],['biology','202','Mr. George'],['english','106','Ms. Haydee / Ms. Gulnoza'],['math','','Mr. James / Mr. Anvar'],['chemistry','203','Mr. Shahzod / Ms. Anna'],['chemistry','203','Mr. Shahzod / Ms. Anna']],
            fri: [['cs','103','Mr. Ravshan'],['math','','Mr. James / Mr. Anvar'],['physics','201','Mr. Rejo / Mr. Otabek'],['uzbek','204','Mr. Ruslan'],['english','106','Ms. Haydee / Ms. Gulnoza']]
        }
    },
    '10': {
        blue: {
            mon: [['ks','103','Mr. Sirojiddin'],['history','207','Mr. Baxtiyor'],['english','106','Ms. Gulnoza'],['math','204','Mr. Anvar'],['russian','108','Mr. Azamat'],['@oa','203',''],['@oa','203',''],['pe','Sports Hall','Mr. Obid']],
            tue: [['math','101','Mr. Anvar'],['law','105','Mr. Bobur'],['history','207','Mr. Baxtiyor'],['russian','108','Mr. Azamat'],['@ob','201',''],['@ob','201',''],['english','106','Ms. Gulnoza']],
            wed: [['literature','206','Ms. Xurshida'],['pe','Sports Hall','Mr. Obid'],['math','106','Mr. Anvar'],['@ob','202',''],['@ob','202',''],['uzbek','206','Ms. Xurshida'],['mp','207','Mr. Furqat']],
            thu: [['@oa','201',''],['@oa','201',''],['math','102','Mr. Anvar'],['uzbek','206','Ms. Xurshida'],['ce','207','Mr. Bobur'],['@ob','201',''],['@ob','201','']],
            fri: [['@oa','203',''],['@oa','203',''],['mp','207','Mr. Furqat'],['math','109','Mr. Anvar'],['gp','109','Mr. Amir']]
        },
        green: {
            mon: [['ks','102','Mr. Asror'],['ce','105','Mr. Bobur'],['math','101','Mr. Anvar'],['pe','Sports Hall','Mr. Obid'],['pe','Sports Hall','Mr. Obid'],['@oa','203',''],['@oa','203',''],['literature','204','Mr. Ruslan']],
            tue: [['uzbek','204','Mr. Ruslan'],['mp','207','Mr. Furqat'],['math','109','Mr. Anvar'],['gp','109','Mr. Amir'],['@ob','201',''],['@ob','201',''],['history','207',"Mr. To'lqin"]],
            wed: [['law','207','Mr. Bobur'],['math','108','Mr. Anvar'],['russian','108','Mr. Azamat'],['@ob','202',''],['@ob','202',''],['history','207',"Mr. To'lqin"],['english','109','Mr. Asadbek']],
            thu: [['@oa','201',''],['@oa','201',''],['uzbek','204','Mr. Ruslan'],['math','101','Mr. Anvar'],['russian','108','Mr. Azamat'],['@ob','201',''],['@ob','201','']],
            fri: [['@oa','203',''],['@oa','203',''],['math','101','Mr. Anvar'],['mp','207','Mr. Furqat'],['english','107','Mr. Asadbek']]
        }
    },
    '11': {
        blue: {
            mon: [['ks','107','Mr. Kamoliddin'],['@ob','201',''],['@ob','201',''],['english','107','Mr. Kamoliddin'],['gp','109','Mr. Amir'],['math','101','Mr. Asror'],['history','207','Mr. Baxtiyor']],
            tue: [['@oa','203',''],['@oa','203',''],['math','101','Mr. Asror'],['ce','207','Mr. Bobur'],['literature','206','Ms. Xurshida'],['uzbek','206','Ms. Xurshida'],['english','107','Mr. Kamoliddin']],
            wed: [['@ob','202',''],['@ob','202',''],['math','101','Mr. Asror'],['mp','207','Mr. Furqat'],['law','207','Mr. Bobur'],['@oa','203',''],['@oa','203','']],
            thu: [['history','207','Mr. Baxtiyor'],['pe','Sports Hall','Mr. Obid'],['math','101','Mr. Asror'],['@ob','202',''],['@ob','202',''],['mp','207','Mr. Furqat'],['russian','108','Mr. Azamat'],['pe','Sports Hall','Mr. Obid']],
            fri: [['russian','108','Mr. Azamat'],['uzbek','206','Ms. Xurshida'],['@oa','104',''],['@oa','104',''],['math','101','Mr. Asror']]
        },
        green: {
            mon: [['ks','104','Mr. Jahongir'],['@ob','201',''],['@ob','201',''],['math','101','Mr. Asror'],['english','207','Mr. Asadbek'],['uzbek','204','Mr. Ruslan'],['russian','108','Mr. Azamat']],
            tue: [['@oa','203',''],['@oa','203',''],['law','105','Mr. Bobur'],['math','101','Mr. Asror'],['uzbek','204','Mr. Ruslan'],['english','204','Mr. Asadbek']],
            wed: [['@ob','202',''],['@ob','202',''],['literature','204','Mr. Ruslan'],['russian','108','Mr. Azamat'],['math','101','Mr. Asror'],['@oa','203',''],['@oa','203','']],
            thu: [['gp','109','Mr. Amir'],['history','207',"Mr. To'lqin"],['pe','Sports Hall','Mr. Obid'],['@ob','202',''],['@ob','202',''],['math','101','Mr. Asror'],['history','207',"Mr. To'lqin"]],
            fri: [['mp','207','Mr. Furqat'],['math','101','Mr. Asror'],['@oa','104',''],['@oa','104',''],['mp','207','Mr. Furqat'],['ce','207','Mr. Bobur'],['pe','Sports Hall','Mr. Obid']]
        }
    }
};
