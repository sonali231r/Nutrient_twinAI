import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "./client";
import type { User, Profile, UserRole, AppRole } from "./types";

export interface AuthResult {
  success: boolean;
  error?: string;
  user?: User;
  profile?: Profile;
  roles?: AppRole[];
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signUp(
  email: string,
  password: string,
  fullName?: string,
): Promise<AuthResult> {
  try {
    const db = await getDb();

    // Check if user already exists
    const existingUser = await db.collection<User>("users").findOne({ email });
    if (existingUser) {
      return { success: false, error: "User already exists" };
    }

    // Validate password
    if (password.length < 6) {
      return { success: false, error: "Password must be at least 6 characters" };
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const userId = uuidv4();

    // Create user
    const user: User = {
      _id: userId,
      id: userId,
      email,
      password_hash: passwordHash,
      full_name: fullName,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.collection<User>("users").insertOne(user);

    // Create profile
    const profile: Profile = {
      _id: userId,
      id: userId,
      full_name: fullName,
      created_at: new Date(),
      updated_at: new Date(),
    };

    await db.collection<Profile>("profiles").insertOne(profile);

    // Create default role
    const userRole: UserRole = {
      _id: uuidv4(),
      id: uuidv4(),
      user_id: userId,
      role: "user",
      created_at: new Date(),
    };

    await db.collection<UserRole>("user_roles").insertOne(userRole);

    return { success: true, user, profile, roles: ["user"] };
  } catch (error) {
    console.error("Sign up error:", error);
    return { success: false, error: "Failed to create account" };
  }
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  try {
    const db = await getDb();

    // Find user
    const user = await db.collection<User>("users").findOne({ email });
    if (!user) {
      return { success: false, error: "Invalid login credentials" };
    }

    // Verify password
    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: "Invalid login credentials" };
    }

    // Get profile
    const profile = await db.collection<Profile>("profiles").findOne({ id: user.id });

    // Get roles
    const userRoles = await db
      .collection<UserRole>("user_roles")
      .find({ user_id: user.id })
      .toArray();
    const roles = userRoles.map((r) => r.role);

    return { success: true, user, profile: profile || undefined, roles };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "Failed to sign in" };
  }
}

export async function getUserRoles(userId: string): Promise<AppRole[]> {
  try {
    const db = await getDb();
    const userRoles = await db
      .collection<UserRole>("user_roles")
      .find({ user_id: userId })
      .toArray();
    return userRoles.map((r) => r.role);
  } catch (error) {
    console.error("Get user roles error:", error);
    return [];
  }
}

export async function hasRole(userId: string, role: AppRole): Promise<boolean> {
  const roles = await getUserRoles(userId);
  return roles.includes(role);
}
