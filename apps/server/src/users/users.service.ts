import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { hash, verify } from 'argon2';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async create(createUserDto: Prisma.UserCreateInput) {
    try {
      const checkEmail = await this.prisma.user.findUnique({
        where: {
          email: createUserDto.email,
        },
      });
      if (checkEmail) {
        throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...newUser } = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: await hash(createUserDto.password),
        },
      });
      return {
        message: 'User created successfully',
        data: newUser,
        success: true,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkEmail(email: string) {
    try {
      const checkEmail = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });
      if (!checkEmail) {
        throw new HttpException('User does not exist', HttpStatus.BAD_REQUEST);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...rest } = checkEmail;
      return {
        message: 'email verify',
        success: true,
        data: rest,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async checkPassword(password: string, userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          userId,
        },
      });

      if (!user) {
        throw new HttpException(
          `User with ${userId} does not exist`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const verifyPassword = await verify(user.password, password);
      if (!verifyPassword) {
        throw new HttpException(
          'Please check password',
          HttpStatus.BAD_REQUEST,
        );
      }
      const token = await this.jwt.signAsync({
        userId: user.userId,
        email: user.email,
      });
      return {
        message: 'Login successfully',
        token: token,
        success: true,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserDetails(req: Request) {
    try {
      const token = req.cookies.token;
      const user = await this.getUserDetailsFromToken(token);
      return {
        message: 'user details',
        data: user,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateUser(updateUserDto: Prisma.UserUpdateInput, req: Request) {
    try {
      const token = req.cookies.token;
      const user = await this.getUserDetailsFromToken(token);
      if ('userId' in user) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...updatedUser } = await this.prisma.user.update({
          where: {
            userId: user.userId,
          },
          data: {
            ...updateUserDto,
          },
        });
        return {
          message: 'user update successfully',
          data: updatedUser,
          success: true,
        };
      }
      return user;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async searchUser(search: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...user } = await this.prisma.user.findFirst({
        where: {
          OR: [
            {
              name: {
                contains: search,
              },
            },
            {
              email: {
                contains: search,
              },
            },
          ],
        },
      });
      return {
        message: 'all user',
        data: user,
        success: true,
      };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserDetailsFromToken(token: string) {
    if (!token) {
      return {
        message: 'session out',
        logout: true,
      };
    }
    const decode: { userId: number; email: string } = await this.jwt.decode(
      token,
    );
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...user } = await this.prisma.user.findUnique({
      where: {
        userId: decode.userId,
      },
    });
    return user;
  }
}
