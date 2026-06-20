import { createServerFn } from "@tanstack/react-start";
import type {
  Profile,
  HealthRecord,
  DietPlan,
  FoodDatabase,
  Notification,
  Prediction,
  ProgressLog,
  SystemLog,
  UserRole,
} from "./types";

const getProfileFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getProfile(userId);
  });

const updateProfileFn = createServerFn({ method: "POST" })
  .validator((input: { userId: string; data: Partial<Profile> }) => input)
  .handler(async ({ data: { userId, data } }) => {
    const { db } = await import("./db.server");
    return db.updateProfile(userId, data);
  });

const getHealthRecordFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getHealthRecord(userId);
  });

const createHealthRecordFn = createServerFn({ method: "POST" })
  .validator((data: Omit<HealthRecord, "_id" | "id" | "created_at" | "updated_at">) => data)
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    return db.createHealthRecord(data);
  });

const updateHealthRecordFn = createServerFn({ method: "POST" })
  .validator((input: { userId: string; data: Partial<HealthRecord> }) => input)
  .handler(async ({ data: { userId, data } }) => {
    const { db } = await import("./db.server");
    return db.updateHealthRecord(userId, data);
  });

const getDietPlansFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getDietPlans(userId);
  });

const createDietPlanFn = createServerFn({ method: "POST" })
  .validator((data: Omit<DietPlan, "_id" | "id" | "created_at">) => data)
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    return db.createDietPlan(data);
  });

const getFoodDatabaseFn = createServerFn({ method: "GET" }).handler(async () => {
  const { db } = await import("./db.server");
  return db.getFoodDatabase();
});

const searchFoodFn = createServerFn({ method: "GET" })
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    const { db } = await import("./db.server");
    return db.searchFood(query);
  });

const getNotificationsFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getNotifications(userId);
  });

const markNotificationAsReadFn = createServerFn({ method: "POST" })
  .validator((notificationId: string) => notificationId)
  .handler(async ({ data: notificationId }) => {
    const { db } = await import("./db.server");
    return db.markNotificationAsRead(notificationId);
  });

const getPredictionFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getPrediction(userId);
  });

const createPredictionFn = createServerFn({ method: "POST" })
  .validator((data: Omit<Prediction, "_id" | "id" | "created_at">) => data)
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    return db.createPrediction(data);
  });

const getProgressLogsFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getProgressLogs(userId);
  });

const createProgressLogFn = createServerFn({ method: "POST" })
  .validator((data: Omit<ProgressLog, "_id" | "id" | "created_at">) => data)
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    return db.createProgressLog(data);
  });

const updateProgressLogFn = createServerFn({ method: "POST" })
  .validator((input: { userId: string; logDate: Date; data: Partial<ProgressLog> }) => input)
  .handler(async ({ data: { userId, logDate, data } }) => {
    const { db } = await import("./db.server");
    return db.updateProgressLog(userId, logDate, data);
  });

const createSystemLogFn = createServerFn({ method: "POST" })
  .validator((data: Omit<SystemLog, "_id" | "id" | "created_at">) => data)
  .handler(async ({ data }) => {
    const { db } = await import("./db.server");
    return db.createSystemLog(data);
  });

const getUserRolesDbFn = createServerFn({ method: "GET" })
  .validator((userId: string) => userId)
  .handler(async ({ data: userId }) => {
    const { db } = await import("./db.server");
    return db.getUserRoles(userId);
  });

export const db = {
  getProfile: (userId: string) => getProfileFn({ data: userId }),
  updateProfile: (userId: string, data: Partial<Profile>) =>
    updateProfileFn({ data: { userId, data } }),
  getHealthRecord: (userId: string) => getHealthRecordFn({ data: userId }),
  createHealthRecord: (data: Omit<HealthRecord, "_id" | "id" | "created_at" | "updated_at">) =>
    createHealthRecordFn({ data }),
  updateHealthRecord: (userId: string, data: Partial<HealthRecord>) =>
    updateHealthRecordFn({ data: { userId, data } }),
  getDietPlans: (userId: string) => getDietPlansFn({ data: userId }),
  createDietPlan: (data: Omit<DietPlan, "_id" | "id" | "created_at">) => createDietPlanFn({ data }),
  getFoodDatabase: () => getFoodDatabaseFn(),
  searchFood: (query: string) => searchFoodFn({ data: query }),
  getNotifications: (userId: string) => getNotificationsFn({ data: userId }),
  markNotificationAsRead: (notificationId: string) =>
    markNotificationAsReadFn({ data: notificationId }),
  getPrediction: (userId: string) => getPredictionFn({ data: userId }),
  createPrediction: (data: Omit<Prediction, "_id" | "id" | "created_at">) =>
    createPredictionFn({ data }),
  getProgressLogs: (userId: string) => getProgressLogsFn({ data: userId }),
  createProgressLog: (data: Omit<ProgressLog, "_id" | "id" | "created_at">) =>
    createProgressLogFn({ data }),
  updateProgressLog: (userId: string, logDate: Date, data: Partial<ProgressLog>) =>
    updateProgressLogFn({ data: { userId, logDate, data } }),
  createSystemLog: (data: Omit<SystemLog, "_id" | "id" | "created_at">) =>
    createSystemLogFn({ data }),
  getUserRoles: (userId: string) => getUserRolesDbFn({ data: userId }),
};
