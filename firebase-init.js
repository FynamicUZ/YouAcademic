// =============================================================================
// Firebase Cloud Sync for Academic Dashboard
// =============================================================================
//
// SETUP (one-time, before this feature can work):
//   1. Go to https://console.firebase.google.com and create a new project.
//   2. In the project, click the </> "Web app" icon and register an app.
//      Copy the firebaseConfig object you get and paste it below, replacing
//      the placeholder values.
//   3. In the Firebase console: Build → Authentication → Sign-in method,
//      enable Google as a sign-in provider.
//   4. In the Firebase console: Build → Firestore Database → Create database
//      (start in test mode for development).
//   5. After things work, tighten Firestore rules to the following so each
//      user can only read/write their own data:
//
//      rules_version = '2';
//      service cloud.firestore {
//        match /databases/{database}/documents {
//          match /users/{uid}/{document=**} {
//            allow read, write: if request.auth != null && request.auth.uid == uid;
//          }
//        }
//      }
//
//   6. If serving via `file://`, Google sign-in won't work — run a local
//      server (e.g. `npx serve`) and open http://localhost:3000.
// =============================================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ---- PASTE YOUR FIREBASE CONFIG HERE ----------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyBOlxyDSqDKA2vLiLsw0uwGUzfklSA0O0c",
    authDomain: "youacademic-8cee2.firebaseapp.com",
    projectId: "youacademic-8cee2",
    storageBucket: "youacademic-8cee2.firebasestorage.app",
    messagingSenderId: "346556599525",
    appId: "1:346556599525:web:84fa781f83a2b224b0180c"
};
// -----------------------------------------------------------------------------

const CONFIGURED = !firebaseConfig.apiKey.startsWith("YOUR_");

const ui = {
    pill: () => document.getElementById('cloud-sync-pill'),
    label: () => document.getElementById('cloud-user-label'),
    status: () => document.getElementById('cloud-sync-status'),
    signinBtn: () => document.getElementById('btn-cloud-signin'),
    signoutBtn: () => document.getElementById('btn-cloud-signout'),
};

function setStatus(text, kind) {
    const el = ui.status();
    if (!el) return;
    el.textContent = text;
    el.className = 'sync-status' + (kind ? ' ' + kind : '');
}

function showSignedIn(user) {
    ui.label().textContent = user.email || user.displayName || 'Signed in';
    ui.signinBtn().style.display = 'none';
    ui.signoutBtn().style.display = 'inline-block';
}

function showSignedOut() {
    ui.label().textContent = 'Not signed in';
    ui.signinBtn().style.display = 'inline-block';
    ui.signoutBtn().style.display = 'none';
    setStatus('', '');
}

// Hook button events even if Firebase isn't configured, so we can warn the user
document.addEventListener('DOMContentLoaded', () => {
    const signin = ui.signinBtn();
    const signout = ui.signoutBtn();
    if (signin) {
        signin.addEventListener('click', () => {
            if (!CONFIGURED) {
                if (window.showToast) window.showToast('Firebase is not configured. See firebase-init.js for setup steps.', 'error');
                return;
            }
            if (window.__cloudSignIn) window.__cloudSignIn();
        });
    }
    if (signout) {
        signout.addEventListener('click', () => {
            if (window.__cloudSignOut) window.__cloudSignOut();
        });
    }
});

if (!CONFIGURED) {
    console.warn('[firebase-init] Firebase config not set. Cloud sync disabled. Edit firebase-init.js to enable.');
    // Stop here — don't initialize Firebase with placeholder values.
} else {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const provider = new GoogleAuthProvider();

    let currentUser = null;
    let saveTimer = null;
    let pendingPayloadJson = null; // JSON of the payload waiting to be pushed (for beforeunload flush)
    let suppressNextSave = false; // true while we just pulled cloud data into local state

    // Build the comparable payload (no updatedAt) for diffing local vs cloud
    function buildLocalPayload() {
        const s = window.appState || {};
        return {
            studentInfo: {
                name: s.studentName || '',
                grade: s.grade || '',
                electiveOB: s.electiveOB || '',
                electiveOA: s.electiveOA || ''
            },
            subjects: s.subjects || [],
            grades: s.grades || {}
        };
    }

    function buildCloudPayload(cloud) {
        return {
            studentInfo: cloud.studentInfo || {},
            subjects: Array.isArray(cloud.subjects) ? cloud.subjects : [],
            grades: (cloud.grades && typeof cloud.grades === 'object') ? cloud.grades : {}
        };
    }

    // Stored on successful push or successful pull — represents the last known in-sync state
    const SIG_KEY = 'cloudSyncedSignature';
    function rememberSignature(jsonStr) {
        try { localStorage.setItem(SIG_KEY, jsonStr); } catch (e) { /* ignore */ }
    }
    function readSignature() {
        try { return localStorage.getItem(SIG_KEY); } catch (e) { return null; }
    }

    // Order-stable JSON: sorts object keys recursively so Firestore's response
    // (which may serialize keys in a different order than we wrote) still
    // compares equal to the local payload.
    function stableStringify(v) {
        if (v === undefined) return 'null';
        if (Array.isArray(v)) return '[' + v.map(stableStringify).join(',') + ']';
        if (v && typeof v === 'object') {
            const keys = Object.keys(v).sort();
            return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(v[k])).join(',') + '}';
        }
        return JSON.stringify(v);
    }

    async function doSignIn() {
        try {
            setStatus('Signing in…', 'syncing');
            await signInWithPopup(auth, provider);
        } catch (err) {
            console.error(err);
            setStatus('Sign-in failed', 'error');
            if (window.showToast) window.showToast('Sign-in failed: ' + err.message, 'error');
        }
    }

    async function doSignOut() {
        try {
            await signOut(auth);
            if (window.showToast) window.showToast('Signed out. Local data preserved.');
        } catch (err) {
            console.error(err);
        }
    }

    // Expose for the global button-click handlers attached above
    window.__cloudSignIn = doSignIn;
    window.__cloudSignOut = doSignOut;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            currentUser = user;
            showSignedIn(user);
            await reconcileWithCloud(user.uid);
            installAutoSync();
        } else {
            currentUser = null;
            showSignedOut();
            uninstallAutoSync();
        }
    });

    async function reconcileWithCloud(uid) {
        setStatus('Loading cloud data…', 'syncing');
        try {
            const ref = doc(db, 'users', uid, 'data', 'dashboard');
            const snap = await getDoc(ref);

            const localHasData = (window.appState?.subjects?.length || 0) > 0
                || (window.appState?.studentName?.length || 0) > 0;

            if (!snap.exists()) {
                // First sign-in for this account: cloud is empty
                if (localHasData) {
                    const choice = await askFirstSyncChoice();
                    if (choice === 'upload') {
                        await pushToCloud(uid);
                        setStatus('Synced ✓', 'synced');
                        if (window.showToast) window.showToast('Local data uploaded to cloud.');
                    } else {
                        // User declined — leave cloud empty, but stay in synced state
                        // so future edits will create the doc via autosync
                        setStatus('Synced ✓', 'synced');
                        if (window.showToast) window.showToast('Skipped upload. Future changes will sync to cloud.');
                    }
                } else {
                    setStatus('Synced ✓', 'synced');
                }
                return;
            }

            const cloud = snap.data();

            if (!localHasData) {
                // No local data, just pull
                applyCloudData(cloud);
                setStatus('Synced ✓', 'synced');
                if (window.showToast) window.showToast('Loaded data from cloud.');
                return;
            }

            // Both have data — check for real divergence before prompting
            const localJson = stableStringify(buildLocalPayload());
            const cloudJson = stableStringify(buildCloudPayload(cloud));

            if (localJson === cloudJson) {
                // Already in sync (the common reload case) — no prompt
                rememberSignature(localJson);
                setStatus('Synced ✓', 'synced');
                return;
            }

            // They differ — use the stored signature to figure out who changed
            const lastSig = readSignature();
            if (lastSig && cloudJson === lastSig) {
                // Cloud hasn't moved since last sync, only local has → push local up silently
                // (covers "user closed tab during the debounce window" case)
                await pushToCloud(uid);
                setStatus('Synced ✓', 'synced');
                return;
            }
            if (lastSig && localJson === lastSig) {
                // Local hasn't moved since last sync, only cloud has → pull cloud silently
                // (covers "edits made on another device while this one was idle")
                applyCloudData(cloud);
                setStatus('Synced ✓', 'synced');
                if (window.showToast) window.showToast('Updated from cloud.');
                return;
            }

            // Genuine conflict (both diverged from last known sync, or no signature) — ask
            const choice = await askMergeChoice();
            if (choice === 'cloud') {
                applyCloudData(cloud);
                if (window.showToast) window.showToast('Replaced local with cloud data.');
            } else if (choice === 'local') {
                await pushToCloud(uid);
                if (window.showToast) window.showToast('Replaced cloud with local data.');
            } else {
                setStatus('Sync cancelled', 'error');
                return;
            }
            setStatus('Synced ✓', 'synced');
        } catch (err) {
            console.error(err);
            setStatus('Sync error', 'error');
        }
    }

    function applyCloudData(cloud) {
        suppressNextSave = true;
        const s = window.appState;
        if (cloud.studentInfo) {
            s.studentName = cloud.studentInfo.name || '';
            s.grade = cloud.studentInfo.grade || '';
            s.electiveOB = cloud.studentInfo.electiveOB || '';
            s.electiveOA = cloud.studentInfo.electiveOA || '';
        }
        if (Array.isArray(cloud.subjects)) s.subjects = cloud.subjects;
        if (cloud.grades && typeof cloud.grades === 'object') s.grades = cloud.grades;

        // Persist to localStorage and refresh UI through existing entry points
        if (typeof window.saveAllData === 'function') window.saveAllData();
        if (typeof window.renderSidebar === 'function') window.renderSidebar();
        if (typeof window.renderDashboard === 'function') window.renderDashboard();
        suppressNextSave = false;
        // Local now matches the pulled cloud copy
        rememberSignature(stableStringify(buildCloudPayload(cloud)));
    }

    async function pushToCloud(uid) {
        const base = buildLocalPayload();
        const payload = { ...base, updatedAt: serverTimestamp() };
        const ref = doc(db, 'users', uid, 'data', 'dashboard');
        await setDoc(ref, payload);
        // After a successful push, local and cloud are in sync — remember the signature
        rememberSignature(stableStringify(base));
        pendingPayloadJson = null;
    }

    // Best-effort flush when the tab is closing. Firestore's setDoc returns a promise
    // we can't truly await on unload — but kicking it off still lets the request reach
    // the network in many cases, and on next load the signature-based reconcile will
    // silently push if it didn't.
    function handleBeforeUnload() {
        if (currentUser && saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
            try { pushToCloud(currentUser.uid); } catch (e) { /* best-effort */ }
        }
    }

    function installAutoSync() {
        if (!window.__originalSaveAllData) {
            window.__originalSaveAllData = window.saveAllData;
        }
        window.saveAllData = function () {
            // Always save to localStorage first — never lose data locally
            window.__originalSaveAllData();
            if (!currentUser || suppressNextSave) return;
            // Track the pending payload (for beforeunload flush) and debounce the cloud write
            pendingPayloadJson = stableStringify(buildLocalPayload());
            clearTimeout(saveTimer);
            saveTimer = setTimeout(async () => {
                saveTimer = null;
                setStatus('Syncing…', 'syncing');
                try {
                    await pushToCloud(currentUser.uid);
                    setStatus('Synced ✓', 'synced');
                } catch (err) {
                    console.error(err);
                    setStatus('Sync error', 'error');
                }
            }, 5000);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
    }

    function uninstallAutoSync() {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        if (window.__originalSaveAllData) {
            window.saveAllData = window.__originalSaveAllData;
            window.__originalSaveAllData = null;
        }
        clearTimeout(saveTimer);
    }

    async function askMergeChoice() {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const messageEl = document.getElementById('confirm-message');
            const confirmBtn = document.getElementById('btn-modal-confirm');
            const cancelBtn = document.getElementById('btn-modal-cancel');

            messageEl.innerHTML = `Cloud data found for this account.<br><br>Click <strong>OK</strong> to use the <strong>cloud</strong> copy (overwrites local).<br>Click <strong>Cancel</strong> to keep <strong>local</strong> data (overwrites cloud).`;
            modal.classList.add('active');

            // Replace buttons to clear old listeners (matches the pattern used elsewhere)
            const newConfirm = confirmBtn.cloneNode(true);
            const newCancel = cancelBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

            newConfirm.addEventListener('click', () => {
                modal.classList.remove('active');
                resolve('cloud');
            });
            newCancel.addEventListener('click', () => {
                modal.classList.remove('active');
                resolve('local');
            });
        });
    }

    async function askFirstSyncChoice() {
        return new Promise((resolve) => {
            const modal = document.getElementById('custom-confirm-modal');
            const messageEl = document.getElementById('confirm-message');
            const confirmBtn = document.getElementById('btn-modal-confirm');
            const cancelBtn = document.getElementById('btn-modal-cancel');

            messageEl.innerHTML = `Your cloud account has no saved data yet.<br><br>Should the grades currently on this device be uploaded to your cloud account?<br><br>Click <strong>OK</strong> to upload, <strong>Cancel</strong> to skip.`;
            modal.classList.add('active');

            const newConfirm = confirmBtn.cloneNode(true);
            const newCancel = cancelBtn.cloneNode(true);
            confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);
            cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);

            newConfirm.addEventListener('click', () => {
                modal.classList.remove('active');
                resolve('upload');
            });
            newCancel.addEventListener('click', () => {
                modal.classList.remove('active');
                resolve('skip');
            });
        });
    }
}
