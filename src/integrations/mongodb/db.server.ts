import { getDb } from "./client";
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

export const db = {
  // Profiles
  async getProfile(userId: string): Promise<Profile | null> {
    const database = await getDb();
    return database.collection<Profile>("profiles").findOne({ id: userId });
  },

  async updateProfile(userId: string, data: Partial<Profile>): Promise<void> {
    const database = await getDb();
    await database
      .collection<Profile>("profiles")
      .updateOne({ id: userId }, { $set: { ...data, updated_at: new Date() } });
  },

  // Health Records
  async getHealthRecord(userId: string): Promise<HealthRecord | null> {
    const database = await getDb();
    return database.collection<HealthRecord>("health_records").findOne({ user_id: userId });
  },

  async createHealthRecord(
    data: Omit<HealthRecord, "_id" | "id" | "created_at" | "updated_at">,
  ): Promise<void> {
    const database = await getDb();
    const id = crypto.randomUUID();
    await database.collection<HealthRecord>("health_records").insertOne({
      ...data,
      _id: id,
      id,
      created_at: new Date(),
      updated_at: new Date(),
    });
  },

  async updateHealthRecord(userId: string, data: Partial<HealthRecord>): Promise<void> {
    const database = await getDb();
    await database
      .collection<HealthRecord>("health_records")
      .updateOne({ user_id: userId }, { $set: { ...data, updated_at: new Date() } });
  },

  // Diet Plans
  async getDietPlans(userId: string): Promise<DietPlan[]> {
    const database = await getDb();
    return database.collection<DietPlan>("diet_plans").find({ user_id: userId }).toArray();
  },

  async createDietPlan(data: Omit<DietPlan, "_id" | "id" | "created_at">): Promise<void> {
    const database = await getDb();
    const id = crypto.randomUUID();
    await database.collection<DietPlan>("diet_plans").insertOne({
      ...data,
      _id: id,
      id,
      created_at: new Date(),
    });
  },

  // Food Database
  async getFoodDatabase(): Promise<FoodDatabase[]> {
    const database = await getDb();
    return database.collection<FoodDatabase>("food_database").find({}).toArray();
  },

  async searchFood(query: string): Promise<FoodDatabase[]> {
    const database = await getDb();
    return database
      .collection<FoodDatabase>("food_database")
      .find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          { food_type: { $regex: query, $options: "i" } },
        ],
      })
      .toArray();
  },

  // Notifications
  async getNotifications(userId: string): Promise<Notification[]> {
    const database = await getDb();
    return database
      .collection<Notification>("notifications")
      .find({ user_id: userId })
      .sort({ created_at: -1 })
      .toArray();
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const database = await getDb();
    await database
      .collection<Notification>("notifications")
      .updateOne({ id: notificationId }, { $set: { read: true } });
  },

  // Predictions
  async getPrediction(userId: string): Promise<Prediction | null> {
    const database = await getDb();
    return database.collection<Prediction>("predictions").findOne({ user_id: userId });
  },

  async createPrediction(data: Omit<Prediction, "_id" | "id" | "created_at">): Promise<void> {
    const database = await getDb();
    const id = crypto.randomUUID();
    await database.collection<Prediction>("predictions").insertOne({
      ...data,
      _id: id,
      id,
      created_at: new Date(),
    });
  },

  // Progress Logs
  async getProgressLogs(userId: string): Promise<ProgressLog[]> {
    const database = await getDb();
    return database
      .collection<ProgressLog>("progress_logs")
      .find({ user_id: userId })
      .sort({ log_date: -1 })
      .toArray();
  },

  async createProgressLog(data: Omit<ProgressLog, "_id" | "id" | "created_at">): Promise<void> {
    const database = await getDb();
    const id = crypto.randomUUID();
    await database.collection<ProgressLog>("progress_logs").insertOne({
      ...data,
      _id: id,
      id,
      created_at: new Date(),
    });
  },

  async updateProgressLog(
    userId: string,
    logDate: Date,
    data: Partial<ProgressLog>,
  ): Promise<void> {
    const database = await getDb();
    await database
      .collection<ProgressLog>("progress_logs")
      .updateOne({ user_id: userId, log_date: logDate }, { $set: data });
  },

  // System Logs
  async createSystemLog(data: Omit<SystemLog, "_id" | "id" | "created_at">): Promise<void> {
    const database = await getDb();
    const id = crypto.randomUUID();
    await database.collection<SystemLog>("system_logs").insertOne({
      ...data,
      _id: id,
      id,
      created_at: new Date(),
    });
  },

  // User Roles
  async getUserRoles(userId: string): Promise<UserRole[]> {
    const database = await getDb();
    return database.collection<UserRole>("user_roles").find({ user_id: userId }).toArray();
  },
};
