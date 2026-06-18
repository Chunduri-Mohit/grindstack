import { auth, db } from "../firebase/config";
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

export interface UserProfile {
  id?: number;
  username: string;
  profilePic: string;
  xp: number;
  longestStreak: number; // stores current/longest streak
  currentGroupId: string | null;
  currentGroupName: string | null;
  totalTasksCompletedAllTime: number;
  badgeCount: number;
  lastResetDateString: string;
  routineStreak: number;
  graceDaysAllowedThisWeek: number;
  graceDaysUsedThisWeek: number;
}

export interface Task {
  id: string;
  name: string;
  category: string;
  isCompleted: boolean;
  isCustom: boolean;
  streak: number;
  lastCompletedDate: string | null;
}

export interface DailyHabits {
  dateString: string;
  gymCompleted: boolean;
  dietCompleted: boolean;
  skincareCompleted: boolean;
  sleepCompleted: boolean;
  bedtime: string;
  wakeTime: string;
}

export interface TechLog {
  id: string;
  topic: string;
  platform: string;
  count: number;
  dateString: string;
  xpEarned: number;
}

export interface GroupMember {
  userId: string;
  username: string;
  dailyCompletionPercentage: number;
  currentStreak: number;
  totalTasksAllTime: number;
  xp: number;
  profilePic: string;
  activeBreakdown: string; // Comma separated tasks
  isMe: boolean;
}

// Helpers
export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DEFAULT_TASKS: Task[] = [
  { id: "def_1", name: "LeetCode Problem of the Day", category: "tech", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null },
  { id: "def_2", name: "Striver's DSA Exercise", category: "tech", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null },
  { id: "def_3", name: "Go to Gym & workout", category: "health", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null },
  { id: "def_4", name: "Eat a nutrition-focused clean diet", category: "health", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null },
  { id: "def_5", name: "Complete PM Skincare routine", category: "health", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null },
  { id: "def_6", name: "Read Tech or Subject Books (30m)", category: "tech", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null },
  { id: "def_7", name: "Perform Daily Routine check", category: "discipline", isCompleted: false, isCustom: false, streak: 0, lastCompletedDate: null }
];

// LocalStorage Keys
const KEYS = {
  PROFILE: "grindstack_profile",
  TASKS: "grindstack_tasks",
  HABITS: "grindstack_habits",
  TECH_LOGS: "grindstack_tech_logs",
  LEADERBOARD: "grindstack_leaderboard"
};

export const localDb = {
  // --- USER PROFILE ---
  getProfile(): UserProfile {
    const data = localStorage.getItem(KEYS.PROFILE);
    if (data) {
      return JSON.parse(data);
    }
    const today = getTodayDateString();
    const newProfile: UserProfile = {
      username: "Grinder",
      profilePic: "avatar_1",
      xp: 20,
      longestStreak: 0,
      currentGroupId: null,
      currentGroupName: null,
      totalTasksCompletedAllTime: 0,
      badgeCount: 0,
      lastResetDateString: today,
      routineStreak: 0,
      graceDaysAllowedThisWeek: 2,
      graceDaysUsedThisWeek: 0
    };
    this.saveProfile(newProfile);
    return newProfile;
  },

  saveProfile(profile: UserProfile) {
    localStorage.setItem(KEYS.PROFILE, JSON.stringify(profile));
  },

  // --- TASKS ---
  getTasks(): Task[] {
    const data = localStorage.getItem(KEYS.TASKS);
    if (data) {
      return JSON.parse(data);
    }
    localStorage.setItem(KEYS.TASKS, JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  },

  saveTasks(tasks: Task[]) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },

  // --- HABITS ---
  getAllHabits(): DailyHabits[] {
    const data = localStorage.getItem(KEYS.HABITS);
    return data ? JSON.parse(data) : [];
  },

  getHabitsForToday(): DailyHabits {
    const today = getTodayDateString();
    const all = this.getAllHabits();
    const existing = all.find(h => h.dateString === today);
    if (existing) return existing;

    const newHabit: DailyHabits = {
      dateString: today,
      gymCompleted: false,
      dietCompleted: false,
      skincareCompleted: false,
      sleepCompleted: false,
      bedtime: "22:30",
      wakeTime: "06:30"
    };
    this.saveHabit(newHabit);
    return newHabit;
  },

  saveHabit(habit: DailyHabits) {
    const all = this.getAllHabits();
    const idx = all.findIndex(h => h.dateString === habit.dateString);
    if (idx >= 0) {
      all[idx] = habit;
    } else {
      all.push(habit);
    }
    localStorage.setItem(KEYS.HABITS, JSON.stringify(all));
  },

  prepopulateMockHistory() {
    const all: DailyHabits[] = [];
    const today = new Date();
    const dateFormat = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Prepopulate random history for 20 days
    for (let i = 1; i <= 20; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const ds = dateFormat(d);
      all.push({
        dateString: ds,
        gymCompleted: Math.random() > 0.3,
        dietCompleted: Math.random() > 0.4,
        skincareCompleted: Math.random() > 0.2,
        sleepCompleted: Math.random() > 0.5,
        bedtime: "22:30",
        wakeTime: "06:30"
      });
    }
    localStorage.setItem(KEYS.HABITS, JSON.stringify(all));
  },

  // --- TECH STUDY LOGS ---
  getTechLogs(): TechLog[] {
    const data = localStorage.getItem(KEYS.TECH_LOGS);
    return data ? JSON.parse(data) : [];
  },

  addTechLog(topic: string, platform: string, count: number): TechLog {
    const logs = this.getTechLogs();
    const xpEarned = 15;
    const newLog: TechLog = {
      id: Math.random().toString(36).substr(2, 9),
      topic,
      platform,
      count,
      dateString: getTodayDateString(),
      xpEarned
    };
    logs.push(newLog);
    localStorage.setItem(KEYS.TECH_LOGS, JSON.stringify(logs));

    // Award XP
    const profile = this.getProfile();
    profile.xp += xpEarned;
    this.saveProfile(profile);

    return newLog;
  },

  // --- LEADERBOARD CACHE ---
  getLeaderboardCache(): GroupMember[] {
    const data = localStorage.getItem(KEYS.LEADERBOARD);
    return data ? JSON.parse(data) : [];
  },

  saveLeaderboardCache(members: GroupMember[]) {
    localStorage.setItem(KEYS.LEADERBOARD, JSON.stringify(members));
  },

  // --- OPERATION FLOWS MATCHING REPOSITORY ---
  async checkAndPerformMidnightReset(): Promise<{ resetDone: boolean; profile: UserProfile }> {
    const profile = this.getProfile();
    const today = getTodayDateString();

    if (profile.lastResetDateString !== today) {
      const currentTasks = this.getTasks();
      let allowedGrace = profile.graceDaysAllowedThisWeek;
      let graceUsedNow = profile.graceDaysUsedThisWeek;

      // Handle weekly grace reset on Monday
      const lastResetDate = new Date(profile.lastResetDateString);
      const todayDate = new Date(today);
      const isNewWeek = lastResetDate.getDay() > todayDate.getDay() || (todayDate.getTime() - lastResetDate.getTime()) > 7 * 86400000;
      if (isNewWeek) {
        graceUsedNow = 0;
      }

      const updatedTasks = currentTasks.map(t => {
        if (t.isCompleted) {
          return {
            ...t,
            isCompleted: false,
            streak: t.streak + 1,
            lastCompletedDate: profile.lastResetDateString
          };
        } else {
          if (allowedGrace > graceUsedNow) {
            graceUsedNow += 1;
            return {
              ...t,
              isCompleted: false,
              lastCompletedDate: profile.lastResetDateString
            };
          } else {
            return {
              ...t,
              isCompleted: false,
              streak: 0
            };
          }
        }
      });

      this.saveTasks(updatedTasks);
      
      // Ensure daily habits exist for today
      this.getHabitsForToday();

      // Check routine streak: if all standard tasks were completed
      const allCompletedBeforeReset = currentTasks.filter(t => !t.isCustom).every(t => t.isCompleted);

      const newProfile: UserProfile = {
        ...profile,
        lastResetDateString: today,
        graceDaysUsedThisWeek: graceUsedNow,
        routineStreak: allCompletedBeforeReset ? profile.routineStreak + 1 : 0
      };

      this.saveProfile(newProfile);

      // Async Firestore updates
      if (auth.currentUser) {
        await this.pushUserProfileToFirestore(newProfile);
        if (newProfile.currentGroupId) {
          await this.syncSquadMembers(newProfile.currentGroupId, newProfile);
        }
      }

      return { resetDone: true, profile: newProfile };
    }

    return { resetDone: false, profile };
  },

  async toggleTaskCompletion(taskId: string, isCompleted: boolean): Promise<{ profile: UserProfile; tasks: Task[] }> {
    const tasks = this.getTasks();
    const taskIdx = tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return { profile: this.getProfile(), tasks };

    const task = tasks[taskIdx];
    const newStreak = isCompleted ? (task.streak + 1) : Math.max(0, task.streak - 1);
    const updatedTask = {
      ...task,
      isCompleted,
      streak: newStreak,
      lastCompletedDate: isCompleted ? getTodayDateString() : task.lastCompletedDate
    };

    tasks[taskIdx] = updatedTask;
    this.saveTasks(tasks);

    // Award XP
    const profile = this.getProfile();
    const xpGain = isCompleted ? 10 : -10;
    profile.xp = Math.max(0, profile.xp + xpGain);

    const totalTasksInc = isCompleted ? 1 : -1;
    profile.totalTasksCompletedAllTime = Math.max(0, profile.totalTasksCompletedAllTime + totalTasksInc);
    profile.longestStreak = Math.max(profile.longestStreak, updatedTask.streak);

    profile.badgeCount = 
      profile.totalTasksCompletedAllTime >= 100 ? 5 :
      profile.totalTasksCompletedAllTime >= 50 ? 4 :
      profile.totalTasksCompletedAllTime >= 25 ? 3 :
      profile.totalTasksCompletedAllTime >= 10 ? 2 :
      profile.totalTasksCompletedAllTime >= 5 ? 1 : 0;

    this.saveProfile(profile);

    // Link Task completion to DailyHabits
    const todayHabits = this.getHabitsForToday();
    let changed = false;
    const lowerName = task.name.toLowerCase();

    if (lowerName.includes("gym")) {
      if (todayHabits.gymCompleted !== isCompleted) {
        todayHabits.gymCompleted = isCompleted;
        changed = true;
      }
    } else if (lowerName.includes("diet")) {
      if (todayHabits.dietCompleted !== isCompleted) {
        todayHabits.dietCompleted = isCompleted;
        changed = true;
      }
    } else if (lowerName.includes("skincare")) {
      if (todayHabits.skincareCompleted !== isCompleted) {
        todayHabits.skincareCompleted = isCompleted;
        changed = true;
      }
    } else if (lowerName.includes("sleep")) {
      if (todayHabits.sleepCompleted !== isCompleted) {
        todayHabits.sleepCompleted = isCompleted;
        changed = true;
      }
    }

    if (changed) {
      this.saveHabit(todayHabits);
    }

    // Push to firebase if logged in
    if (auth.currentUser) {
      await this.pushUserProfileToFirestore(profile);
      await this.syncLocalToLeaderboard(profile, tasks);
    }

    return { profile, tasks };
  },

  async pushUserProfileToFirestore(profile: UserProfile) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userData = {
        uid: user.uid,
        username: profile.username,
        profilePhoto: profile.profilePic,
        xp: profile.xp,
        streak: profile.longestStreak,
        currentGroupId: profile.currentGroupId,
        currentGroupName: profile.currentGroupName
      };
      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
    } catch (e) {
      console.error("Firestore user profile push failed", e);
    }
  },

  async syncUserProfileFromFirestore(): Promise<UserProfile> {
    const user = auth.currentUser;
    const profile = this.getProfile();
    if (!user) return profile;

    try {
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        const updated: UserProfile = {
          ...profile,
          username: data.username || user.displayName || "Grinder",
          profilePic: data.profilePhoto || "avatar_1",
          xp: typeof data.xp === 'number' ? data.xp : profile.xp,
          longestStreak: Math.max(profile.longestStreak, typeof data.streak === 'number' ? data.streak : 0),
          currentGroupId: data.currentGroupId || null,
          currentGroupName: data.currentGroupName || null
        };
        this.saveProfile(updated);
        
        if (updated.currentGroupId) {
          await this.syncSquadMembers(updated.currentGroupId, updated);
        }
        return updated;
      }
    } catch (e) {
      console.error("Firestore user profile pull failed", e);
    }
    return profile;
  },

  async syncLocalToLeaderboard(profile: UserProfile, tasks: Task[]): Promise<GroupMember | null> {
    const user = auth.currentUser;
    if (!user) return null;

    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const pct = total > 0 ? (completed / total) * 100 : 0;

    const me: GroupMember = {
      userId: user.uid,
      username: profile.username,
      dailyCompletionPercentage: parseFloat(pct.toFixed(1)),
      currentStreak: profile.longestStreak,
      totalTasksAllTime: profile.totalTasksCompletedAllTime,
      xp: profile.xp,
      profilePic: profile.profilePic,
      activeBreakdown: tasks.filter(t => t.isCompleted).map(t => t.name).join(","),
      isMe: true
    };

    // Update local cache
    const cached = this.getLeaderboardCache();
    const filtered = cached.filter(m => m.userId !== user.uid);
    filtered.push(me);
    this.saveLeaderboardCache(filtered);

    try {
      if (profile.currentGroupId) {
        // Update squad name if exists
        if (profile.currentGroupName) {
          await setDoc(doc(db, "squads", profile.currentGroupId), { name: profile.currentGroupName }, { merge: true });
        }
        // Update member details
        await setDoc(doc(db, "squads", profile.currentGroupId, "members", user.uid), me);
      }
    } catch (e) {
      console.error("Firestore member leaderboard push failed", e);
    }
    return me;
  },

  async syncSquadMembers(groupId: string, profile: UserProfile): Promise<GroupMember[]> {
    const user = auth.currentUser;
    
    // Seed leaderboard with self first
    const tasks = this.getTasks();
    await this.syncLocalToLeaderboard(profile, tasks);

    try {
      const snap = await getDocs(collection(db, "squads", groupId, "members"));
      if (!snap.empty) {
        const members: GroupMember[] = [];
        snap.forEach(doc => {
          const data = doc.data() as Omit<GroupMember, "userId" | "isMe">;
          members.push({
            ...data,
            userId: doc.id,
            isMe: user ? doc.id === user.uid : false
          });
        });

        this.saveLeaderboardCache(members);
        return members;
      }
    } catch (e) {
      console.error("Firestore sync squad members failed", e);
    }

    return this.getLeaderboardCache();
  },

  extractSquadId(input: string): string {
    const trimmed = input.trim();
    // Regular expression for hub-xxx matching Android regex: (hub-[a-z0-9\-]+)
    const hubRegex = /(hub-[a-z0-9\-]+)/i;
    const match = trimmed.match(hubRegex);
    if (match) {
      return match[1].toLowerCase().trim();
    }
    if (trimmed.includes("/")) {
      return trimmed.split("/").pop()?.trim() || trimmed;
    }
    return trimmed;
  },

  async resolveSquadId(input: string): Promise<{ id: string; name: string | null }> {
    const cleanGroupId = this.extractSquadId(input);

    try {
      const directSnap = await getDoc(doc(db, "squads", cleanGroupId));
      if (directSnap.exists()) {
        return {
          id: cleanGroupId,
          name: directSnap.data().name || null
        };
      }

      const lowerInput = input.trim().toLowerCase();
      const squadsSnap = await getDocs(collection(db, "squads"));
      const matchingSquad = squadsSnap.docs.find(squadDoc => {
        const data = squadDoc.data();
        const squadName = String(data.name || "").trim().toLowerCase();
        return squadDoc.id.toLowerCase() === lowerInput || squadName === lowerInput;
      });

      if (matchingSquad) {
        return {
          id: matchingSquad.id,
          name: matchingSquad.data().name || null
        };
      }
    } catch (e) {
      console.error("Firestore resolve squad failed", e);
    }

    return { id: cleanGroupId, name: null };
  },

  async joinSquad(squadIdInput: string, squadNameInput: string): Promise<UserProfile> {
    const resolvedSquad = await this.resolveSquadId(squadIdInput);
    const cleanGroupId = resolvedSquad.id;
    let finalGroupName = squadNameInput.trim() || resolvedSquad.name || "";

    if (!finalGroupName || finalGroupName === cleanGroupId) {
      try {
        const snap = await getDoc(doc(db, "squads", cleanGroupId));
        if (snap.exists()) {
          finalGroupName = snap.data().name || "Squad Tribe";
        } else {
          finalGroupName = "Squad Tribe";
        }
      } catch {
        finalGroupName = "Squad Tribe";
      }
    }

    const profile = this.getProfile();
    profile.currentGroupId = cleanGroupId;
    profile.currentGroupName = finalGroupName;
    this.saveProfile(profile);

    if (auth.currentUser) {
      await this.pushUserProfileToFirestore(profile);
      await this.syncSquadMembers(cleanGroupId, profile);
    }

    return profile;
  },

  async leaveSquad(): Promise<UserProfile> {
    const profile = this.getProfile();
    const user = auth.currentUser;
    const oldGroupId = profile.currentGroupId;

    profile.currentGroupId = null;
    profile.currentGroupName = null;
    this.saveProfile(profile);

    this.saveLeaderboardCache([]);

    if (user && oldGroupId) {
      try {
        await deleteDoc(doc(db, "squads", oldGroupId, "members", user.uid));
        await this.pushUserProfileToFirestore(profile);
      } catch (e) {
        console.error("Firestore leave squad failed", e);
      }
    }

    return profile;
  },

  updateProfileInfo(username: string, profilePic: string): UserProfile {
    const profile = this.getProfile();
    profile.username = username;
    profile.profilePic = profilePic;
    this.saveProfile(profile);
    if (auth.currentUser) {
      this.pushUserProfileToFirestore(profile);
      this.syncLocalToLeaderboard(profile, this.getTasks());
    }
    return profile;
  },

  saveDailyHabits(habits: DailyHabits) {
    this.saveHabit(habits);

    // Sync habits back to tasks if it's for today
    if (habits.dateString === getTodayDateString()) {
      const tasks = this.getTasks();
      const updatedTasks = tasks.map(t => {
        const lowerName = t.name.toLowerCase();
        if (lowerName.includes("gym")) return { ...t, isCompleted: habits.gymCompleted };
        if (lowerName.includes("diet")) return { ...t, isCompleted: habits.dietCompleted };
        if (lowerName.includes("skincare")) return { ...t, isCompleted: habits.skincareCompleted };
        if (lowerName.includes("sleep")) return { ...t, isCompleted: habits.sleepCompleted };
        return t;
      });
      this.saveTasks(updatedTasks);
    }

    const profile = this.getProfile();
    const isPerfect = habits.gymCompleted && habits.dietCompleted && habits.skincareCompleted && habits.sleepCompleted;
    if (isPerfect) {
      profile.xp += 5;
      this.saveProfile(profile);
      if (auth.currentUser) {
        this.pushUserProfileToFirestore(profile);
      }
    }
    if (auth.currentUser) {
      this.syncLocalToLeaderboard(profile, this.getTasks());
    }
  },

  createCustomTask(name: string, category: string): Task[] {
    const tasks = this.getTasks();
    const newTask: Task = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      category,
      isCompleted: false,
      isCustom: true,
      streak: 0,
      lastCompletedDate: null
    };
    tasks.push(newTask);
    this.saveTasks(tasks);
    
    // Sync with leaderboard if logged in
    if (auth.currentUser) {
      const profile = this.getProfile();
      this.syncLocalToLeaderboard(profile, tasks);
    }
    return tasks;
  },

  updateTask(taskId: string, name: string, category: string): Task[] {
    const trimmedName = name.trim();
    if (!trimmedName) return this.getTasks();

    const tasks = this.getTasks().map(task =>
      task.id === taskId
        ? { ...task, name: trimmedName, category }
        : task
    );
    this.saveTasks(tasks);

    if (auth.currentUser) {
      const profile = this.getProfile();
      this.syncLocalToLeaderboard(profile, tasks);
    }
    return tasks;
  },

  deleteTask(taskId: string): Task[] {
    const tasks = this.getTasks().filter(t => t.id !== taskId);
    this.saveTasks(tasks);

    if (auth.currentUser) {
      const profile = this.getProfile();
      this.syncLocalToLeaderboard(profile, tasks);
    }
    return tasks;
  },

  reorderTasks(taskIds: string[]): Task[] {
    const tasks = this.getTasks();
    const taskById = new Map(tasks.map(task => [task.id, task]));
    const orderedTasks = taskIds
      .map(id => taskById.get(id))
      .filter((task): task is Task => Boolean(task));
    const remainingTasks = tasks.filter(task => !taskIds.includes(task.id));
    const nextTasks = [...orderedTasks, ...remainingTasks];
    this.saveTasks(nextTasks);

    if (auth.currentUser) {
      const profile = this.getProfile();
      this.syncLocalToLeaderboard(profile, nextTasks);
    }
    return nextTasks;
  },

  deleteCustomTask(taskId: string): Task[] {
    return this.deleteTask(taskId);
  },

  clearAllData() {
    localStorage.removeItem(KEYS.PROFILE);
    localStorage.removeItem(KEYS.TASKS);
    localStorage.removeItem(KEYS.HABITS);
    localStorage.removeItem(KEYS.TECH_LOGS);
    localStorage.removeItem(KEYS.LEADERBOARD);
  }
};
