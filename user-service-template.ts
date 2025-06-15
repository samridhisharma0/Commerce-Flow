// User Service Implementation Template
// This template demonstrates the architecture patterns for a microservice

import express from 'express';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { UserController } from './controllers/UserController';
import { UserService } from './services/UserService';
import { UserRepository } from './repositories/UserRepository';
import { DatabaseConnection } from './infrastructure/DatabaseConnection';
import { EventBus } from './infrastructure/EventBus';
import { Logger } from './infrastructure/Logger';
import { HealthController } from './controllers/HealthController';
import { MetricsMiddleware } from './middleware/MetricsMiddleware';
import { AuthMiddleware } from './middleware/AuthMiddleware';
import { ValidationMiddleware } from './middleware/ValidationMiddleware';

// Domain Models
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  roles: string[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  avatar?: string;
  addresses: Address[];
  preferences: UserPreferences;
}

export interface Address {
  id: string;
  type: 'shipping' | 'billing';
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface UserPreferences {
  currency: string;
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// DTOs
export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  preferences?: UserPreferences;
}

export interface UserResponse {
  id: string;
  email: string;
  profile: UserProfile;
  roles: string[];
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Repository Interface
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  update(id: string, updates: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
  findByStatus(status: UserStatus): Promise<User[]>;
}

// Service Interface
export interface IUserService {
  createUser(request: CreateUserRequest): Promise<UserResponse>;
  getUserById(id: string): Promise<UserResponse | null>;
  updateUser(id: string, request: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(id: string): Promise<void>;
  authenticateUser(email: string, password: string): Promise<{ user: UserResponse; token: string } | null>;
}

// Repository Implementation
export class UserRepository implements IUserRepository {
  constructor(
    private db: DatabaseConnection,
    private logger: Logger
  ) {}

  async findById(id: string): Promise<User | null> {
    try {
      const query = `
        SELECT u.*, up.first_name, up.last_name, up.avatar_url, up.preferences
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.id = $1
      `;
      
      const result = await this.db.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return this.mapRowToUser(row);
    } catch (error) {
      this.logger.error('Error finding user by ID', { id, error });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const query = `
        SELECT u.*, up.first_name, up.last_name, up.avatar_url, up.preferences
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.email = $1
      `;
      
      const result = await this.db.query(query, [email]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToUser(result.rows[0]);
    } catch (error) {
      this.logger.error('Error finding user by email', { email, error });
      throw error;
    }
  }

  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Insert user
      const userInsertQuery = `
        INSERT INTO users (email, password_hash, status, roles)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at, updated_at
      `;
      
      const userResult = await client.query(userInsertQuery, [
        user.email,
        user.passwordHash,
        user.status,
        JSON.stringify(user.roles)
      ]);

      const userId = userResult.rows[0].id;

      // Insert user profile
      const profileInsertQuery = `
        INSERT INTO user_profiles (user_id, first_name, last_name, preferences)
        VALUES ($1, $2, $3, $4)
      `;
      
      await client.query(profileInsertQuery, [
        userId,
        user.profile.firstName,
        user.profile.lastName,
        JSON.stringify(user.profile.preferences)
      ]);

      await client.query('COMMIT');

      return {
        ...user,
        id: userId,
        createdAt: userResult.rows[0].created_at,
        updatedAt: userResult.rows[0].updated_at
      };
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error creating user', { user: { email: user.email }, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const client = await this.db.getClient();
    
    try {
      await client.query('BEGIN');

      // Update user table if needed
      if (updates.email || updates.passwordHash || updates.status || updates.roles) {
        const updateFields: string[] = [];
        const updateValues: any[] = [];
        let paramIndex = 1;

        if (updates.email) {
          updateFields.push(`email = $${paramIndex++}`);
          updateValues.push(updates.email);
        }
        
        if (updates.passwordHash) {
          updateFields.push(`password_hash = $${paramIndex++}`);
          updateValues.push(updates.passwordHash);
        }
        
        if (updates.status) {
          updateFields.push(`status = $${paramIndex++}`);
          updateValues.push(updates.status);
        }
        
        if (updates.roles) {
          updateFields.push(`roles = $${paramIndex++}`);
          updateValues.push(JSON.stringify(updates.roles));
        }

        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        updateValues.push(id);

        const userUpdateQuery = `
          UPDATE users 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
        `;
        
        await client.query(userUpdateQuery, updateValues);
      }

      // Update profile if needed
      if (updates.profile) {
        const profileUpdateQuery = `
          UPDATE user_profiles 
          SET first_name = $1, last_name = $2, preferences = $3
          WHERE user_id = $4
        `;
        
        await client.query(profileUpdateQuery, [
          updates.profile.firstName,
          updates.profile.lastName,
          JSON.stringify(updates.profile.preferences),
          id
        ]);
      }

      await client.query('COMMIT');

      // Return updated user
      const updatedUser = await this.findById(id);
      if (!updatedUser) {
        throw new Error('User not found after update');
      }

      return updatedUser;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Error updating user', { id, error });
      throw error;
    } finally {
      client.release();
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const query = 'DELETE FROM users WHERE id = $1';
      await this.db.query(query, [id]);
    } catch (error) {
      this.logger.error('Error deleting user', { id, error });
      throw error;
    }
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    try {
      const query = `
        SELECT u.*, up.first_name, up.last_name, up.avatar_url, up.preferences
        FROM users u
        LEFT JOIN user_profiles up ON u.id = up.user_id
        WHERE u.status = $1
      `;
      
      const result = await this.db.query(query, [status]);
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      this.logger.error('Error finding users by status', { status, error });
      throw error;
    }
  }

  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      profile: {
        firstName: row.first_name,
        lastName: row.last_name,
        avatar: row.avatar_url,
        addresses: [], // Load separately if needed
        preferences: row.preferences ? JSON.parse(row.preferences) : {
          currency: 'USD',
          language: 'en',
          notifications: { email: true, sms: false, push: true }
        }
      },
      roles: row.roles ? JSON.parse(row.roles) : ['customer'],
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

// Service Implementation
export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private eventBus: EventBus,
    private logger: Logger
  ) {}

  async createUser(request: CreateUserRequest): Promise<UserResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(request.password);

      // Create user entity
      const userToCreate = {
        email: request.email,
        passwordHash,
        profile: {
          firstName: request.firstName,
          lastName: request.lastName,
          addresses: [],
          preferences: {
            currency: 'USD',
            language: 'en',
            notifications: {
              email: true,
              sms: false,
              push: true
            }
          }
        },
        roles: ['customer'],
        status: UserStatus.PENDING_VERIFICATION
      };

      const createdUser = await this.userRepository.create(userToCreate);

      // Publish user created event
      await this.eventBus.publish({
        type: 'user.created',
        data: {
          userId: createdUser.id,
          email: createdUser.email,
          createdAt: createdUser.createdAt
        }
      });

      this.logger.info('User created successfully', { userId: createdUser.id, email: createdUser.email });

      return this.mapUserToResponse(createdUser);
    } catch (error) {
      this.logger.error('Error creating user', { email: request.email, error });
      throw error;
    }
  }

  async getUserById(id: string): Promise<UserResponse | null> {
    try {
      const user = await this.userRepository.findById(id);
      return user ? this.mapUserToResponse(user) : null;
    } catch (error) {
      this.logger.error('Error getting user by ID', { id, error });
      throw error;
    }
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<UserResponse> {
    try {
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new Error('User not found');
      }

      const updates: Partial<User> = {};
      
      if (request.firstName || request.lastName || request.preferences) {
        updates.profile = {
          ...existingUser.profile,
          ...(request.firstName && { firstName: request.firstName }),
          ...(request.lastName && { lastName: request.lastName }),
          ...(request.preferences && { preferences: request.preferences })
        };
      }

      const updatedUser = await this.userRepository.update(id, updates);

      // Publish user updated event
      await this.eventBus.publish({
        type: 'user.updated',
        data: {
          userId: updatedUser.id,
          updatedAt: updatedUser.updatedAt,
          changes: request
        }
      });

      this.logger.info('User updated successfully', { userId: id });

      return this.mapUserToResponse(updatedUser);
    } catch (error) {
      this.logger.error('Error updating user', { id, error });
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new Error('User not found');
      }

      await this.userRepository.delete(id);

      // Publish user deleted event
      await this.eventBus.publish({
        type: 'user.deleted',
        data: {
          userId: id,
          email: user.email,
          deletedAt: new Date()
        }
      });

      this.logger.info('User deleted successfully', { userId: id });
    } catch (error) {
      this.logger.error('Error deleting user', { id, error });
      throw error;
    }
  }

  async authenticateUser(email: string, password: string): Promise<{ user: UserResponse; token: string } | null> {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      const isValidPassword = await this.verifyPassword(password, user.passwordHash);
      if (!isValidPassword) {
        return null;
      }

      if (user.status !== UserStatus.ACTIVE) {
        throw new Error('User account is not active');
      }

      const token = await this.generateJWTToken(user);

      // Publish user authenticated event
      await this.eventBus.publish({
        type: 'user.authenticated',
        data: {
          userId: user.id,
          email: user.email,
          authenticatedAt: new Date()
        }
      });

      this.logger.info('User authenticated successfully', { userId: user.id, email });

      return {
        user: this.mapUserToResponse(user),
        token
      };
    } catch (error) {
      this.logger.error('Error authenticating user', { email, error });
      throw error;
    }
  }

  private mapUserToResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      roles: user.roles,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = require('bcrypt');
    return bcrypt.hash(password, 12);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = require('bcrypt');
    return bcrypt.compare(password, hash);
  }

  private async generateJWTToken(user: User): Promise<string> {
    const jwt = require('jsonwebtoken');
    
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (15 * 60) // 15 minutes
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS256',
      issuer: 'user-service',
      audience: 'ecommerce-platform'
    });
  }
}

// Application Bootstrap
export class UserServiceApplication {
  private container: Container;
  private server: InversifyExpressServer;

  constructor() {
    this.container = new Container();
    this.configureContainer();
    this.server = new InversifyExpressServer(this.container);
    this.configureServer();
  }

  private configureContainer(): void {
    // Infrastructure
    this.container.bind<DatabaseConnection>('DatabaseConnection').to(DatabaseConnection).inSingletonScope();
    this.container.bind<EventBus>('EventBus').to(EventBus).inSingletonScope();
    this.container.bind<Logger>('Logger').to(Logger).inSingletonScope();

    // Repositories
    this.container.bind<IUserRepository>('UserRepository').to(UserRepository);

    // Services
    this.container.bind<IUserService>('UserService').to(UserService);

    // Controllers
    this.container.bind<UserController>('UserController').to(UserController);
    this.container.bind<HealthController>('HealthController').to(HealthController);
  }

  private configureServer(): void {
    this.server.setConfig((app) => {
      app.use(express.json());
      app.use(express.urlencoded({ extended: true }));

      // Add middleware
      app.use('/metrics', new MetricsMiddleware().handler);
      app.use('/api', new AuthMiddleware().handler);
      app.use('/api', new ValidationMiddleware().handler);

      // Error handling
      app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        const logger = this.container.get<Logger>('Logger');
        logger.error('Unhandled error', { error: error.message, stack: error.stack, path: req.path });
        
        res.status(500).json({
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      });
    });
  }

  public async start(): Promise<void> {
    const app = this.server.build();
    const port = process.env.PORT || 3000;

    app.listen(port, () => {
      console.log(`User service started on port ${port}`);
    });
  }
}

// Bootstrap the application
if (require.main === module) {
  const app = new UserServiceApplication();
  app.start().catch(console.error);
}