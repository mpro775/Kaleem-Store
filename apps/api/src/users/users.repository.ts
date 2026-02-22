import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import type { StoreRole } from '../auth/interfaces/auth-user.interface';

export interface UserProfileRecord {
  id: string;
  store_id: string;
  email: string;
  full_name: string;
  role: StoreRole;
  permissions: string[];
  is_active: boolean;
}

export interface StaffInviteRecord {
  id: string;
  store_id: string;
  email: string;
  full_name: string;
  role: StoreRole;
  permissions: string[];
  token_hash: string;
  expires_at: Date;
  accepted_at: Date | null;
  accepted_by_user_id: string | null;
  invited_by_user_id: string;
  created_at: Date;
}

export interface PasswordResetRecord {
  id: string;
  store_user_id: string;
  token_hash: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async listByStore(storeId: string): Promise<UserProfileRecord[]> {
    const result = await this.databaseService.db.query<UserProfileRecord>(
      `
        SELECT id, store_id, email, full_name, role, permissions, is_active
        FROM store_users
        WHERE store_id = $1
        ORDER BY created_at ASC
      `,
      [storeId],
    );

    return result.rows;
  }

  async findById(userId: string): Promise<UserProfileRecord | null> {
    const result = await this.databaseService.db.query<UserProfileRecord>(
      `
        SELECT id, store_id, email, full_name, role, permissions, is_active
        FROM store_users
        WHERE id = $1
        LIMIT 1
      `,
      [userId],
    );
    return result.rows[0] ?? null;
  }

  async findByEmail(email: string): Promise<UserProfileRecord | null> {
    const result = await this.databaseService.db.query<UserProfileRecord>(
      `
        SELECT id, store_id, email, full_name, role, permissions, is_active
        FROM store_users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1
      `,
      [email],
    );
    return result.rows[0] ?? null;
  }

  async updateRoleAndPermissions(input: {
    storeId: string;
    userId: string;
    role: StoreRole;
    permissions: string[];
  }): Promise<UserProfileRecord | null> {
    const result = await this.databaseService.db.query<UserProfileRecord>(
      `
        UPDATE store_users
        SET role = $3,
            permissions = $4::jsonb,
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
        RETURNING id, store_id, email, full_name, role, permissions, is_active
      `,
      [input.userId, input.storeId, input.role, JSON.stringify(input.permissions)],
    );

    return result.rows[0] ?? null;
  }

  async setActiveStatus(input: {
    storeId: string;
    userId: string;
    isActive: boolean;
  }): Promise<UserProfileRecord | null> {
    const result = await this.databaseService.db.query<UserProfileRecord>(
      `
        UPDATE store_users
        SET is_active = $3,
            updated_at = NOW()
        WHERE id = $1
          AND store_id = $2
        RETURNING id, store_id, email, full_name, role, permissions, is_active
      `,
      [input.userId, input.storeId, input.isActive],
    );

    return result.rows[0] ?? null;
  }

  async updatePassword(input: { userId: string; passwordHash: string }): Promise<void> {
    await this.databaseService.db.query(
      `
        UPDATE store_users
        SET password_hash = $2,
            updated_at = NOW()
        WHERE id = $1
      `,
      [input.userId, input.passwordHash],
    );
  }

  async createInvite(input: {
    storeId: string;
    email: string;
    fullName: string;
    role: StoreRole;
    permissions: string[];
    tokenHash: string;
    expiresAt: Date;
    invitedByUserId: string;
  }): Promise<string> {
    const id = uuidv4();
    await this.databaseService.db.query(
      `
        INSERT INTO staff_invites (
          id, store_id, email, full_name, role, permissions, token_hash, expires_at, invited_by_user_id
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9)
      `,
      [
        id,
        input.storeId,
        input.email.toLowerCase(),
        input.fullName,
        input.role,
        JSON.stringify(input.permissions),
        input.tokenHash,
        input.expiresAt,
        input.invitedByUserId,
      ],
    );
    return id;
  }

  async findInviteByToken(tokenHash: string): Promise<StaffInviteRecord | null> {
    const result = await this.databaseService.db.query<StaffInviteRecord>(
      `
        SELECT id, store_id, email, full_name, role, permissions, token_hash, expires_at,
               accepted_at, accepted_by_user_id, invited_by_user_id, created_at
        FROM staff_invites
        WHERE token_hash = $1
        LIMIT 1
      `,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async findPendingInviteByEmail(
    storeId: string,
    email: string,
  ): Promise<StaffInviteRecord | null> {
    const result = await this.databaseService.db.query<StaffInviteRecord>(
      `
        SELECT id, store_id, email, full_name, role, permissions, token_hash, expires_at,
               accepted_at, accepted_by_user_id, invited_by_user_id, created_at
        FROM staff_invites
        WHERE store_id = $1
          AND LOWER(email) = LOWER($2)
          AND accepted_at IS NULL
          AND expires_at > NOW()
        LIMIT 1
      `,
      [storeId, email],
    );
    return result.rows[0] ?? null;
  }

  async deletePendingInvites(storeId: string, email: string): Promise<void> {
    await this.databaseService.db.query(
      `
        DELETE FROM staff_invites
        WHERE store_id = $1
          AND LOWER(email) = LOWER($2)
          AND accepted_at IS NULL
      `,
      [storeId, email],
    );
  }

  async acceptInvite(input: { inviteId: string; userId: string }): Promise<void> {
    await this.databaseService.db.query(
      `
        UPDATE staff_invites
        SET accepted_at = NOW(),
            accepted_by_user_id = $2
        WHERE id = $1
      `,
      [input.inviteId, input.userId],
    );
  }

  async createStaffUser(input: {
    userId: string;
    storeId: string;
    email: string;
    passwordHash: string;
    fullName: string;
    role: StoreRole;
    permissions: string[];
  }): Promise<UserProfileRecord> {
    const result = await this.databaseService.db.query<UserProfileRecord>(
      `
        INSERT INTO store_users (id, store_id, email, password_hash, full_name, role, permissions)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
        RETURNING id, store_id, email, full_name, role, permissions, is_active
      `,
      [
        input.userId,
        input.storeId,
        input.email.toLowerCase(),
        input.passwordHash,
        input.fullName,
        input.role,
        JSON.stringify(input.permissions),
      ],
    );
    return result.rows[0]!;
  }

  async createPasswordReset(input: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<string> {
    const id = uuidv4();
    await this.databaseService.db.query(
      `
        INSERT INTO password_resets (id, store_user_id, token_hash, expires_at)
        VALUES ($1, $2, $3, $4)
      `,
      [id, input.userId, input.tokenHash, input.expiresAt],
    );
    return id;
  }

  async findPasswordResetByToken(tokenHash: string): Promise<PasswordResetRecord | null> {
    const result = await this.databaseService.db.query<PasswordResetRecord>(
      `
        SELECT id, store_user_id, token_hash, expires_at, used_at, created_at
        FROM password_resets
        WHERE token_hash = $1
        LIMIT 1
      `,
      [tokenHash],
    );
    return result.rows[0] ?? null;
  }

  async markPasswordResetUsed(resetId: string): Promise<void> {
    await this.databaseService.db.query(
      `
        UPDATE password_resets
        SET used_at = NOW()
        WHERE id = $1
      `,
      [resetId],
    );
  }

  async listPendingInvites(storeId: string): Promise<StaffInviteRecord[]> {
    const result = await this.databaseService.db.query<StaffInviteRecord>(
      `
        SELECT id, store_id, email, full_name, role, permissions, token_hash, expires_at,
               accepted_at, accepted_by_user_id, invited_by_user_id, created_at
        FROM staff_invites
        WHERE store_id = $1
          AND accepted_at IS NULL
          AND expires_at > NOW()
        ORDER BY created_at DESC
      `,
      [storeId],
    );
    return result.rows;
  }
}
